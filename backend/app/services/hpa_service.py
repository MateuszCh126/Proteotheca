import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
hpa_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_hpa_request(client: httpx.AsyncClient, url: str) -> dict:
    async with hpa_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_hpa_data(client: httpx.AsyncClient, symbol: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        return {
            "symbol": symbol,
            "expression": [
                {"tissue": "Cerebellum", "level": "High", "reliability": "Approved"},
                {"tissue": "Cerebral cortex", "level": "Medium", "reliability": "Approved"},
                {"tissue": "Liver", "level": "Low", "reliability": "Supported"}
            ],
            "localization": ["Cytoplasm", "Nucleoplasm"]
        }

    try:
        url = f"https://www.proteinatlas.org/api/search_download.php?search={symbol}&format=json"
        # HPA search returns a list of matching proteins
        data = await _make_hpa_request(client, url)
        if isinstance(data, list) and len(data) > 0:
            entry = data[0]
            return {
                "symbol": symbol,
                "expression": [
                    {"tissue": t.get("tissue"), "level": t.get("level"), "reliability": t.get("reliability")}
                    for t in entry.get("rna_tissue", [])[:5]
                ],
                "localization": entry.get("subcellular_location", [])
            }
    except Exception as e:
        logger.error(f"Error querying HPA for {symbol}: {str(e)}")

    return {
        "symbol": symbol,
        "expression": [],
        "localization": []
    }
