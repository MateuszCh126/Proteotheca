import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
string_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_string_request(client: httpx.AsyncClient, url: str, params: dict = None) -> list:
    async with string_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_string_network(client: httpx.AsyncClient, symbol: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity STRING network response mock
        return {
            "symbol": symbol,
            "network": [
                {"preferredName_A": symbol, "preferredName_B": "MAP2K1", "score": 0.999},
                {"preferredName_A": symbol, "preferredName_B": "MAP2K2", "score": 0.998},
                {"preferredName_A": symbol, "preferredName_B": "HRAS", "score": 0.995},
                {"preferredName_A": "MAP2K1", "preferredName_B": "MAPK1", "score": 0.999}
            ]
        }

    try:
        url = "https://string-db.org/api/json/network"
        params = {
            "identifiers": symbol,
            "species": 9606,  # Homo sapiens
            "caller_identity": "BioMedExplorer"
        }
        data = await _make_string_request(client, url, params)
        network = []
        if isinstance(data, list):
            for interaction in data[:10]:
                network.append({
                    "preferredName_A": interaction.get("preferredName_A"),
                    "preferredName_B": interaction.get("preferredName_B"),
                    "score": interaction.get("score")
                })
        return {"symbol": symbol, "network": network}
    except Exception as e:
        logger.error(f"Error querying STRING network for {symbol}: {str(e)}")

    return {"symbol": symbol, "network": []}
