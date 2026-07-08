import asyncio
import logging
import httpx
import urllib.parse
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
ols_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_ols_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with ols_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_ontology_term_details(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity mock data for disease or term
        return {
            "iri": f"http://purl.obolibrary.org/obo/DOID_9351",
            "label": query,
            "description": [f"A disease of cellular proliferation that is malignant in nature, originating in skin tissues like melanocytes."],
            "ontology_name": "doid",
            "obo_id": "DOID:9351",
            "synonyms": [f"malignant melanoma", f"melanoma of skin"],
            "parents": [
                {"label": "skin cancer", "obo_id": "DOID:4159"},
                {"label": "neuroendocrine tumor", "obo_id": "DOID:169"}
            ]
        }

    try:
        # 1. Search OLS
        search_url = "https://www.ebi.ac.uk/ols4/api/search"
        search_params = {
            "q": query,
            "ontology": "doid",
            "rows": 1,
            "exact": "true"
        }
        search_res = await _make_ols_request(client, search_url, search_params)
        docs = search_res.get("response", {}).get("docs", [])
        if docs:
            doc = docs[0]
            obo_id = doc.get("obo_id", "")
            return {
                "iri": doc.get("iri", ""),
                "label": doc.get("label", ""),
                "description": doc.get("description", []),
                "ontology_name": doc.get("ontology_name", ""),
                "obo_id": obo_id,
                "synonyms": doc.get("exact_synonyms", []),
                "parents": []
            }
    except Exception as e:
        logger.error(f"Error querying OLS for {query}: {str(e)}")

    return {
        "iri": "",
        "label": query,
        "description": [],
        "ontology_name": "",
        "obo_id": "",
        "synonyms": [],
        "parents": []
    }
