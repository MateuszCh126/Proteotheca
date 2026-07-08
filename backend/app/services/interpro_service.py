import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
interpro_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_interpro_request(client: httpx.AsyncClient, url: str) -> dict:
    async with interpro_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_interpro_data(client: httpx.AsyncClient, uniprot_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        return {
            "uniprot_id": uniprot_id,
            "domains": [
                {
                    "accession": "IPR001367",
                    "name": "Protein kinase domain",
                    "type": "Domain",
                    "start": 450,
                    "end": 710
                },
                {
                    "accession": "IPR015699",
                    "name": "Serine/threonine-protein kinase, active site",
                    "type": "Active_site",
                    "start": 574,
                    "end": 586
                }
            ]
        }

    try:
        url = f"https://www.ebi.ac.uk/interpro/api/entry/InterPro/protein/uniprot/{uniprot_id}"
        data = await _make_interpro_request(client, url)
        results = data.get("results", [])
        domains = []
        for r in results:
            metadata = r.get("metadata", {})
            entry_type = metadata.get("type", "")
            # InterPro returns locations in a list
            for loc in r.get("proteins", [{}])[0].get("entry_protein_locations", []):
                fragments = loc.get("fragments", [{}])
                if fragments:
                    domains.append({
                        "accession": metadata.get("accession"),
                        "name": metadata.get("name"),
                        "type": entry_type,
                        "start": fragments[0].get("start", 0),
                        "end": fragments[0].get("end", 0)
                    })
        return {"uniprot_id": uniprot_id, "domains": domains[:5]}
    except Exception as e:
        logger.error(f"Error querying InterPro for {uniprot_id}: {str(e)}")

    return {"uniprot_id": uniprot_id, "domains": []}
