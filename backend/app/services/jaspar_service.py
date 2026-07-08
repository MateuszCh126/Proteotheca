import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
jaspar_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_jaspar_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with jaspar_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_jaspar_profiles(client: httpx.AsyncClient, symbol: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity JASPAR response mock
        return {
            "symbol": symbol,
            "profiles": [
                {
                    "matrix_id": "MA0139.1" if symbol.upper() == "CTCF" else "MA0001.1",
                    "name": symbol,
                    "collection": "CORE",
                    "tf_class": ["Zinc finger factors"] if symbol.upper() == "CTCF" else ["Unknown"],
                    "pfm": {
                        "A": [10, 20, 15, 8],
                        "C": [5, 45, 10, 80],
                        "G": [70, 5, 60, 2],
                        "T": [15, 30, 15, 10]
                    }
                }
            ]
        }

    try:
        url = "https://jaspar.elixir.no/api/v1/matrix/"
        params = {"search": symbol}
        data = await _make_jaspar_request(client, url, params)
        results = data.get("results", [])
        profiles = []
        for r in results[:2]:
            matrix_id = r.get("matrix_id")
            # Fetch individual matrix details to get the PFM (Position Frequency Matrix)
            detail_url = f"https://jaspar.elixir.no/api/v1/matrix/{matrix_id}/"
            detail_data = await _make_jaspar_request(client, detail_url)
            profiles.append({
                "matrix_id": matrix_id,
                "name": r.get("name"),
                "collection": r.get("collection"),
                "tf_class": r.get("class", []),
                "pfm": detail_data.get("pfm", {})
            })
        return {"symbol": symbol, "profiles": profiles}
    except Exception as e:
        logger.error(f"Error querying JASPAR for {symbol}: {str(e)}")

    return {"symbol": symbol, "profiles": []}
