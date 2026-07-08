import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
ncbi_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_ncbi_request(client: httpx.AsyncClient, url: str, params: dict = None) -> str:
    async with ncbi_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.text

async def fetch_sequence(client: httpx.AsyncClient, accession: str, db: str = "protein", mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity mock FASTA response
        return {
            "accession": accession,
            "db": db,
            "fasta": f">{accession} | mock sequence\nMAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEH\nIEALDKFGNDNGEH"
        }

    try:
        url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        params = {
            "db": db,
            "id": accession,
            "rettype": "fasta",
            "retmode": "text"
        }
        fasta_text = await _make_ncbi_request(client, url, params)
        return {
            "accession": accession,
            "db": db,
            "fasta": fasta_text
        }
    except Exception as e:
        logger.error(f"Error fetching sequence from NCBI for {accession}: {str(e)}")

    return {
        "accession": accession,
        "db": db,
        "fasta": ""
    }
