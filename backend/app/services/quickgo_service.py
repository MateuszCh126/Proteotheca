import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
quickgo_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_quickgo_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with quickgo_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_go_annotations(client: httpx.AsyncClient, uniprot_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity GO annotations mock
        return {
            "uniprot_id": uniprot_id,
            "annotations": [
                {
                    "go_id": "GO:0006468",
                    "aspect": "biological_process",
                    "go_name": "protein phosphorylation",
                    "evidence_code": "IDA",
                    "reference": "PMID:1234567"
                },
                {
                    "go_id": "GO:0005524",
                    "aspect": "molecular_function",
                    "go_name": "ATP binding",
                    "evidence_code": "IBA",
                    "reference": "PMID:7654321"
                }
            ]
        }

    try:
        url = "https://www.ebi.ac.uk/QuickGO/services/annotation/search"
        params = {"geneProductId": uniprot_id}
        data = await _make_quickgo_request(client, url, params)
        results = data.get("results", [])
        annotations = []
        for r in results[:5]:
            annotations.append({
                "go_id": r.get("goId"),
                "aspect": r.get("goAspect"),
                "go_name": r.get("goName"),
                "evidence_code": r.get("goEvidence"),
                "reference": r.get("reference", "")
            })
        return {"uniprot_id": uniprot_id, "annotations": annotations}
    except Exception as e:
        logger.error(f"Error querying QuickGO for {uniprot_id}: {str(e)}")

    return {"uniprot_id": uniprot_id, "annotations": []}
