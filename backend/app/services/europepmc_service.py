import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
epmc_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_epmc_request(client: httpx.AsyncClient, url: str) -> dict:
    async with epmc_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_epmc_articles(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> list:
    if mock_mode:
        # High fidelity EuropePMC response mock
        return [
            {
                "id": "PMC8472910",
                "title": f"Recent advances in {query} research and therapeutic targets",
                "authors": "C. Miller, D. Wilson",
                "pub_date": "2021-09-24",
                "abstract": f"A comprehensive review of the roles of {query} in health and disease.",
                "doi": "10.1016/j.jbiotec.2021.09.001"
            }
        ]

    try:
        url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={query}&format=json"
        data = await _make_epmc_request(client, url)
        results = data.get("resultList", {}).get("result", [])
        articles = []
        for r in results[:3]:
            articles.append({
                "id": r.get("pmcid", r.get("id", "")),
                "title": r.get("title", "").strip(),
                "authors": r.get("authorString", ""),
                "pub_date": r.get("firstPublicationDate", ""),
                "abstract": r.get("abstractText", ""),
                "doi": r.get("doi", "")
            })
        return articles
    except Exception as e:
        logger.error(f"Error querying EuropePMC for {query}: {str(e)}")

    return []
