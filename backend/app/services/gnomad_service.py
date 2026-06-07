import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
gnomad_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_gnomad_request(client: httpx.AsyncClient, query: str, variables: dict) -> dict:
    async with gnomad_sem:
        url = "https://gnomad.broadinstitute.org/api"
        payload = {"query": query, "variables": variables}
        response = await client.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_gnomad_data(client: httpx.AsyncClient, variant_id: str, mock_mode: bool = True) -> dict:
    """
    variant_id format: chr-pos-ref-alt (e.g. 7-140753336-T-A)
    """
    if mock_mode:
        if "rs113488022" in variant_id or "140753336" in variant_id:
            return {
                "allele_frequency": 0.0012,
                "homozygote_count": 0,
                "populations": [
                    {"pop": "European (non-Finnish)", "freq": 0.0020},
                    {"pop": "African", "freq": 0.0001},
                    {"pop": "East Asian", "freq": 0.0000},
                    {"pop": "Latino/Admixed American", "freq": 0.0005}
                ]
            }
        else:
            # Generate plausible mock data based on variant_id
            hash_val = sum(ord(c) for c in variant_id)
            af = (hash_val % 1000) / 10000.0
            return {
                "allele_frequency": af,
                "homozygote_count": hash_val % 3,
                "populations": [
                    {"pop": "European (non-Finnish)", "freq": af * 1.2},
                    {"pop": "African", "freq": af * 0.4},
                    {"pop": "East Asian", "freq": af * 0.1},
                    {"pop": "Latino/Admixed American", "freq": af * 0.8}
                ]
            }

    # Normalize variant ID for gnomAD. gnomAD expects chr-pos-ref-alt format.
    # If starting with chr, keep it, or strip if necessary. Usually "7-140753336-T-A" is valid.
    # Let's ensure format is X-pos-ref-alt (without 'chr' prefix for dataset dataset: "gnomad_r3").
    clean_id = variant_id
    if clean_id.lower().startswith("chr"):
        clean_id = clean_id[3:]
    
    # Replace any colons/underscores/dashes with dash
    clean_id = clean_id.replace(":", "-").replace("_", "-")

    try:
        query = """
        query Variant($variantId: String!) {
          variant(variantId: $variantId, dataset: "gnomad_r3") {
            genome {
              ac
              an
              af
              populations {
                id
                ac
                an
              }
            }
            exome {
              ac
              an
              af
              populations {
                id
                ac
                an
              }
            }
          }
        }
        """
        variables = {"variantId": clean_id}
        res = await _make_gnomad_request(client, query, variables)
        
        variant = res.get("data", {}).get("variant")
        if not variant:
            return {
                "allele_frequency": 0.0,
                "homozygote_count": 0,
                "populations": []
            }
        
        # Merge genome and exome data, prioritizing genome
        data_source = variant.get("genome") or variant.get("exome") or {}
        af = data_source.get("af", 0.0)
        
        # gnomAD homozygote count is usually inside genome/exome details (e.g. homozygote_count or ac_hom)
        # Let's check for homozygote count
        hom_count = data_source.get("homozygote_count", 0)
        if not hom_count:
            hom_count = data_source.get("ac_hom", 0)
            
        populations = []
        raw_pops = data_source.get("populations", [])
        
        pop_names = {
            "afr": "African",
            "amr": "Latino/Admixed American",
            "asj": "Ashkenazi Jewish",
            "eas": "East Asian",
            "fin": "European (Finnish)",
            "nfe": "European (non-Finnish)",
            "oth": "Other",
            "sas": "South Asian",
            "mid": "Middle Eastern"
        }
        
        for pop in raw_pops:
            pop_id = pop.get("id", "").lower()
            pop_ac = pop.get("ac", 0)
            pop_an = pop.get("an", 1)
            pop_freq = pop_ac / pop_an if pop_an > 0 else 0.0
            
            populations.append({
                "pop": pop_names.get(pop_id, pop_id.upper()),
                "freq": round(pop_freq, 6)
            })
            
        return {
            "allele_frequency": af,
            "homozygote_count": hom_count,
            "populations": populations
        }
    except Exception as e:
        logger.error(f"Error querying gnomAD for variant {clean_id}: {str(e)}")
        return {
            "allele_frequency": 0.0,
            "homozygote_count": 0,
            "populations": []
        }
