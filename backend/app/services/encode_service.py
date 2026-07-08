import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
encode_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_graphql_request(client: httpx.AsyncClient, query: str, variables: dict) -> dict:
    async with encode_sem:
        url = "https://factorbook.api.wenglab.org/graphql"
        headers = {
            "Content-Type": "application/json",
            "Origin": "https://screen-v2.wenglab.org",
            "Referer": "https://screen-v2.wenglab.org/"
        }
        response = await client.post(url, json={"query": query, "variables": variables}, headers=headers, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_encode_ccres(client: httpx.AsyncClient, chrom: str, start: int, end: int, mock_mode: bool = True) -> dict:
    if mock_mode:
        return {
            "ccres": [
                {
                    "accession": "EH38E2941922",
                    "chrom": chrom,
                    "start": start,
                    "len": end - start,
                    "pct": "pELS",  # proximal Enhancer-like signature
                    "ctcf_zscore": 1.25,
                    "dnase_zscore": 2.84,
                    "promoter_zscore": 0.45,
                    "enhancer_zscore": 3.12
                }
            ],
            "status": "success"
        }

    query = """
    query Search($assembly: String!, $coords: [GenomicRangeInput!]) {
        cCRESCREENSearch(assembly: $assembly, coordinates: $coords) {
            chrom start len pct
            ctcf_zscore dnase_zscore atac_zscore
            enhancer_zscore promoter_zscore
            info { accession }
        }
    }
    """
    variables = {
        "assembly": "grch38",
        "coords": [{"chromosome": chrom, "start": start, "end": end}]
    }

    try:
        data = await _make_graphql_request(client, query, variables)
        results = data.get("data", {}).get("cCRESCREENSearch", [])
        ccres = []
        for r in results:
            ccres.append({
                "accession": r.get("info", {}).get("accession"),
                "chrom": r.get("chrom"),
                "start": r.get("start"),
                "len": r.get("len"),
                "pct": r.get("pct"),
                "ctcf_zscore": r.get("ctcf_zscore"),
                "dnase_zscore": r.get("dnase_zscore"),
                "promoter_zscore": r.get("promoter_zscore"),
                "enhancer_zscore": r.get("enhancer_zscore")
            })
        return {"ccres": ccres, "status": "success"}
    except Exception as e:
        logger.error(f"Error querying ENCODE GraphQL: {str(e)}")

    return {"ccres": [], "status": "failed"}
