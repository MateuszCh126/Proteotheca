import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
reactome_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_reactome_request(client: httpx.AsyncClient, url: str) -> dict:
    async with reactome_sem:
        response = await client.get(url, timeout=10.0)
        # 444 or 404 is commonly returned if no pathway is found, return empty list
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return response.json()

async def get_reactome_pathways(client: httpx.AsyncClient, uniprot_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity Reactome response mock
        return {
            "uniprot_id": uniprot_id,
            "pathways": [
                {
                    "dbId": 5673001,
                    "displayName": "RAF/MAP kinase cascade",
                    "stId": "R-HSA-5673001"
                },
                {
                    "dbId": 165154,
                    "displayName": "Signaling by EGFR",
                    "stId": "R-HSA-165154"
                }
            ]
        }

    try:
        url = f"https://reactome.org/ContentService/data/pathways/low/entity/{uniprot_id}"
        data = await _make_reactome_request(client, url)
        # Parse pathways
        pathways = []
        if isinstance(data, list):
            for path in data[:5]:
                pathways.append({
                    "dbId": path.get("dbId"),
                    "displayName": path.get("displayName"),
                    "stId": path.get("stId")
                })
        return {"uniprot_id": uniprot_id, "pathways": pathways}
    except Exception as e:
        logger.error(f"Error querying Reactome for {uniprot_id}: {str(e)}")

    return {"uniprot_id": uniprot_id, "pathways": []}
