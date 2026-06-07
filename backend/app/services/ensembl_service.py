import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
ensembl_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_ensembl_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with ensembl_sem:
        headers = {"Content-Type": "application/json"}
        response = await client.get(url, params=params, headers=headers, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_gene_data(client: httpx.AsyncClient, symbol: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity mock data matching PROJECT.md interface contracts
        symbol_upper = symbol.upper()
        mock_genes = {
            "BRAF": {
                "gene_id": "ENSG00000157764",
                "transcripts": [
                    {"transcript_id": "ENST00000644969", "length": 2500},
                    {"transcript_id": "ENST00000288602", "length": 2445}
                ]
            },
            "EGFR": {
                "gene_id": "ENSG00000146648",
                "transcripts": [
                    {"transcript_id": "ENST00000275493", "length": 1210},
                    {"transcript_id": "ENST00000455084", "length": 1105}
                ]
            },
            "TP53": {
                "gene_id": "ENSG00000141510",
                "transcripts": [
                    {"transcript_id": "ENST00000269305", "length": 2588},
                    {"transcript_id": "ENST00000504290", "length": 1500}
                ]
            }
        }
        if symbol_upper in mock_genes:
            return mock_genes[symbol_upper]
        else:
            # Generate plausible mock data for other symbols
            # To preserve mock fidelity and return a stable mock ID
            hash_val = sum(ord(c) for c in symbol_upper)
            gene_num = 100000 + hash_val
            tx_num = 200000 + hash_val
            return {
                "gene_id": f"ENSG00000{gene_num}",
                "transcripts": [
                    {"transcript_id": f"ENST00000{tx_num}", "length": 2000 + (hash_val % 1000)}
                ]
            }

    try:
        # Real Ensembl REST API lookup
        lookup_url = f"https://rest.ensembl.org/lookup/symbol/homo_sapiens/{symbol}"
        gene_info = await _make_ensembl_request(client, lookup_url)
        gene_id = gene_info.get("id")
        if not gene_id:
            raise ValueError(f"Ensembl ID not found for symbol {symbol}")
        
        # Expand transcript info
        expand_url = f"https://rest.ensembl.org/lookup/id/{gene_id}?expand=1"
        expanded_info = await _make_ensembl_request(client, expand_url)
        
        transcripts = []
        raw_transcripts = expanded_info.get("Transcript", [])
        for tx in raw_transcripts:
            tx_id = tx.get("id")
            # Ensembl returns transcript lengths, fallback to start/end delta
            tx_len = tx.get("length", abs(tx.get("end", 0) - tx.get("start", 0)) + 1)
            if tx_id:
                transcripts.append({
                    "transcript_id": tx_id,
                    "length": tx_len
                })
        
        return {
            "gene_id": gene_id,
            "transcripts": transcripts
        }
    except Exception as e:
        logger.error(f"Error querying Ensembl for {symbol}: {str(e)}")
        # Graceful fallback or raise depending on core requirement.
        # Requirements: "handling failures gracefully (returning partial responses)"
        # So we should return empty/default structure if it fails
        return {
            "gene_id": "",
            "transcripts": []
        }

async def liftover_coordinates(client: httpx.AsyncClient, region: str, mock_mode: bool = True) -> dict:
    """
    Region format: chr:start..end (e.g. 7:140453136..140453136) or chr:start-end
    Maps GRCh37 coordinates to GRCh38.
    """
    if mock_mode:
        # Mock mapping
        return {"mapped_region": region, "assembly": "GRCh38"}
    
    # Parse region
    formatted_region = region.replace("-", "..")
    try:
        liftover_url = f"https://rest.ensembl.org/map/human/GRCh37/{formatted_region}/GRCh38"
        data = await _make_ensembl_request(client, liftover_url)
        mappings = data.get("mappings", [])
        if mappings:
            mapped = mappings[0].get("mapped", {})
            mapped_region = mapped.get("name")
            return {
                "mapped_region": mapped_region,
                "assembly": "GRCh38"
            }
    except Exception as e:
        logger.error(f"Error executing liftover for {region}: {str(e)}")
    
    # Return original region as fallback
    return {"mapped_region": region, "assembly": "GRCh38", "error": "Liftover failed"}
