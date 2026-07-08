import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
pdb_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_pdb_request(client: httpx.AsyncClient, url: str) -> dict:
    async with pdb_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_pdb_metadata(client: httpx.AsyncClient, pdb_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity PDB response mock
        return {
            "pdb_id": pdb_id,
            "title": "Crystal structure of BRAF kinase domain in complex with dabrafenib",
            "resolution": 2.15,
            "release_date": "2012-10-15",
            "method": "X-RAY DIFFRACTION",
            "organisms": ["Homo sapiens"]
        }

    try:
        url = f"https://data.rcsb.org/rest/v1/core/entry/{pdb_id}"
        data = await _make_pdb_request(client, url)
        struct = data.get("struct", {})
        rcsb_entry = data.get("rcsb_entry_info", {})
        organisms = []
        for entity in data.get("rcsb_entity_source_organism", []):
            org = entity.get("ncbi_scientific_name")
            if org and org not in organisms:
                organisms.append(org)
                
        return {
            "pdb_id": pdb_id,
            "title": struct.get("title", ""),
            "resolution": rcsb_entry.get("resolution_combined", [None])[0],
            "release_date": data.get("rcsb_accession_info", {}).get("deposit_date"),
            "method": data.get("exptl", [{}])[0].get("method", ""),
            "organisms": organisms
        }
    except Exception as e:
        logger.error(f"Error querying RCSB PDB for {pdb_id}: {str(e)}")

    return {
        "pdb_id": pdb_id,
        "title": "",
        "resolution": 0.0,
        "release_date": "",
        "method": "",
        "organisms": []
    }
