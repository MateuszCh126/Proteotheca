import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
uniprot_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_uniprot_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with uniprot_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_uniprot_data(client: httpx.AsyncClient, symbol: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        symbol_upper = symbol.upper()
        mock_data = {
            "BRAF": {
                "accession": "P15056",
                "name": "BRAF_HUMAN",
                "sequence": "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALDKFGGEHNPP"
            },
            "EGFR": {
                "accession": "P00533",
                "name": "EGFR_HUMAN",
                "sequence": "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNY"
            },
            "TP53": {
                "accession": "P04637",
                "name": "P53_HUMAN",
                "sequence": "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVA"
            }
        }
        if symbol_upper in mock_data:
            return mock_data[symbol_upper]
        else:
            hash_val = sum(ord(c) for c in symbol_upper)
            acc_num = 10000 + hash_val
            return {
                "accession": f"Q{acc_num}",
                "name": f"{symbol_upper}_HUMAN",
                "sequence": "M" + "A" * (50 + (hash_val % 100))
            }

    try:
        url = "https://rest.uniprot.org/uniprotkb/search"
        params = {
            "query": f"gene:{symbol} AND organism_id:9606",
            "format": "json",
            "size": 1
        }
        result = await _make_uniprot_request(client, url, params=params)
        results = result.get("results", [])
        if results:
            entry = results[0]
            accession = entry.get("primaryAccession", "")
            name = entry.get("uniProtkbId", "")
            sequence = entry.get("sequence", {}).get("value", "")
            return {
                "accession": accession,
                "name": name,
                "sequence": sequence
            }
    except Exception as e:
        logger.error(f"Error querying UniProt for {symbol}: {str(e)}")
    
    return {
        "accession": "",
        "name": "",
        "sequence": ""
    }
