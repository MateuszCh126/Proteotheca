import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
clinvar_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_clinvar_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with clinvar_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

def _map_pathogenicity(raw: str) -> str:
    if not raw:
        return "Uncertain Significance"
    raw_lower = raw.lower()
    if "likely pathogenic" in raw_lower:
        return "Likely Pathogenic"
    elif "pathogenic" in raw_lower:
        return "Pathogenic"
    elif "likely benign" in raw_lower:
        return "Likely Benign"
    elif "benign" in raw_lower:
        return "Benign"
    else:
        return "Uncertain Significance"

async def get_clinvar_data(client: httpx.AsyncClient, variant_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        if "rs113488022" in variant_id:
            return {
                "pathogenicity": "Pathogenic",
                "significance": "Pathogenic",
                "review_status": "criteria provided, single submitter"
            }
        else:
            # Generate plausible mock data based on variant_id
            hash_val = sum(ord(c) for c in variant_id)
            paths = ["Pathogenic", "Likely Pathogenic", "Benign", "Likely Benign", "Uncertain Significance"]
            pathogenicity = paths[hash_val % len(paths)]
            return {
                "pathogenicity": pathogenicity,
                "significance": pathogenicity,
                "review_status": "criteria provided, single submitter" if hash_val % 2 == 0 else "no assertion criteria provided"
            }

    try:
        # Step 1: esearch to get ClinVar UID
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "clinvar",
            "term": variant_id,
            "retmode": "json"
        }
        search_res = await _make_clinvar_request(client, search_url, search_params)
        id_list = search_res.get("esearchresult", {}).get("idlist", [])
        
        if not id_list:
            # Try searching without rs prefix if rsID was passed
            if variant_id.startswith("rs"):
                search_params["term"] = variant_id[2:]
                search_res = await _make_clinvar_request(client, search_url, search_params)
                id_list = search_res.get("esearchresult", {}).get("idlist", [])
        
        if not id_list:
            return {
                "pathogenicity": "Uncertain Significance",
                "significance": "Unknown Variant",
                "review_status": "no assertion criteria provided"
            }
        
        clinvar_uid = id_list[0]
        
        # Step 2: esummary to get details
        summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        summary_params = {
            "db": "clinvar",
            "id": clinvar_uid,
            "retmode": "json"
        }
        summary_res = await _make_clinvar_request(client, summary_url, summary_params)
        summary_info = summary_res.get("result", {}).get(clinvar_uid, {})
        
        germline_classification = summary_info.get("germline_classification", {})
        significance = germline_classification.get("description", "Uncertain Significance")
        pathogenicity = _map_pathogenicity(significance)
        review_status = germline_classification.get("review_status", "no assertion criteria provided")
        
        return {
            "pathogenicity": pathogenicity,
            "significance": significance,
            "review_status": review_status
        }
    except Exception as e:
        logger.error(f"Error querying ClinVar for variant {variant_id}: {str(e)}")
        return {
            "pathogenicity": "Uncertain Significance",
            "significance": "Error Querying ClinVar",
            "review_status": "no assertion criteria provided"
        }
