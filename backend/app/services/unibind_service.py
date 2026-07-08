import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
unibind_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_unibind_request(client: httpx.AsyncClient, url: str) -> dict:
    async with unibind_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_unibind_datasets(client: httpx.AsyncClient, tf_name: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity UniBind response mock
        return {
            "tf_name": tf_name,
            "datasets": [
                {
                    "dataset_id": "EXP047889.HMLE-Twist-ER_breast_cancer.SMAD3",
                    "species": "Homo sapiens",
                    "cell_line": "HMLE-Twist-ER",
                    "data_source": "ENCODE",
                    "collection": "Robust"
                }
            ]
        }

    try:
        url = f"https://unibind.uio.no/api/v1/datasets/?tf_name={tf_name}&format=json"
        data = await _make_unibind_request(client, url)
        results = data.get("results", [])
        datasets = []
        for r in results[:5]:
            datasets.append({
                "dataset_id": r.get("url", "").rstrip("/").split("/")[-1],
                "species": r.get("species"),
                "cell_line": r.get("celltype"),
                "data_source": r.get("data_source"),
                "collection": r.get("collection")
            })
        return {"tf_name": tf_name, "datasets": datasets}
    except Exception as e:
        logger.error(f"Error querying UniBind for {tf_name}: {str(e)}")

    return {"tf_name": tf_name, "datasets": []}
