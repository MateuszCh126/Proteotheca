import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
gtex_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_gtex_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with gtex_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

def _prettify_tissue(tissue_id: str) -> str:
    if not tissue_id:
        return ""
    # E.g. "Skin_Sun_Exposed_Lower_leg" -> "Skin - Sun Exposed (Lower leg)"
    parts = tissue_id.replace("_", " ").split(" ")
    prettified = []
    in_paren = False
    for i, part in enumerate(parts):
        if not part:
            continue
        if part.lower() in ("lower", "upper", "leg", "arm", "cortex", "cervix", "liver", "kidney", "heart"):
            if not in_paren and i > 0 and parts[i-1].lower() not in ("lower", "upper"):
                prettified.append(f"({part.capitalize()}")
                in_paren = True
            else:
                prettified.append(part.capitalize())
        else:
            prettified.append(part.capitalize())
    
    res = " ".join(prettified)
    if in_paren:
        res += ")"
    # Replacements for common ones
    res = res.replace("Skin Sun Exposed", "Skin - Sun Exposed")
    res = res.replace("Skin Non Sun Exposed", "Skin - Non Sun Exposed")
    return res

async def get_gtex_data(client: httpx.AsyncClient, variant_id: str, mock_mode: bool = True) -> dict:
    """
    variant_id format: chr-pos-ref-alt (e.g. 7-140753336-T-A)
    GTEx Portal uses chr{chrom}_{pos}_{ref}_{alt}_b38 format.
    """
    if mock_mode:
        if "rs113488022" in variant_id or "140753336" in variant_id:
            return {
                "eqtls": [
                    {
                        "tissue": "Skin - Sun Exposed (Lower leg)",
                        "gene_symbol": "BRAF",
                        "p_value": 1.2e-8,
                        "nes": 0.45
                    }
                ]
            }
        else:
            # Generate plausible mock data based on variant_id
            hash_val = sum(ord(c) for c in variant_id)
            nes = round((hash_val % 100) / 100.0 - 0.5, 3)
            p_val = 1.0 / (10 ** (hash_val % 10 + 2))
            return {
                "eqtls": [
                    {
                        "tissue": "Whole Blood",
                        "gene_symbol": f"GENE{hash_val % 10}",
                        "p_value": p_val,
                        "nes": nes
                    }
                ]
            }

    # Format variant ID for GTEx API: chr{chrom}_{pos}_{ref}_{alt}_b38
    parts = variant_id.replace(":", "-").replace("_", "-").split("-")
    if len(parts) >= 4:
        chrom = parts[0]
        if not chrom.lower().startswith("chr"):
            chrom = f"chr{chrom}"
        gtex_id = f"{chrom}_{parts[1]}_{parts[2]}_{parts[3]}_b38"
    else:
        # Fallback
        gtex_id = variant_id

    try:
        url = "https://gtexportal.org/api/v2/association/singleTissueEqtl"
        params = {
            "variantId": gtex_id,
            "datasetId": "gtex_v8"
        }
        res = await _make_gtex_request(client, url, params=params)
        raw_eqtls = res.get("data", [])
        
        eqtls = []
        for item in raw_eqtls:
            tissue = item.get("tissueSiteDetailId", "")
            gene_symbol = item.get("geneSymbol", "")
            p_val = item.get("pValue", 1.0)
            nes = item.get("nes", 0.0)
            
            eqtls.append({
                "tissue": _prettify_tissue(tissue) or tissue,
                "gene_symbol": gene_symbol,
                "p_value": p_val,
                "nes": nes
            })
            
        return {"eqtls": eqtls}
    except Exception as e:
        logger.error(f"Error querying GTEx for variant {gtex_id}: {str(e)}")
        return {"eqtls": []}
