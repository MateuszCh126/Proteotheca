import asyncio
import logging
import httpx
import re
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
biorxiv_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_biorxiv_request(client: httpx.AsyncClient, url: str) -> dict:
    async with biorxiv_sem:
        response = await client.get(url, timeout=10.0)
        # 404 is returned if not found
        if response.status_code == 404:
            return {}
        response.raise_for_status()
        return response.json()

async def get_biorxiv_preprint(client: httpx.AsyncClient, doi: str, mock_mode: bool = True) -> dict:
    """
    Fetch details for a single bioRxiv preprint by DOI.
    """
    if mock_mode:
        return {
            "doi": doi,
            "title": "A high-fidelity bioRxiv preprint on gene mechanisms",
            "authors": "Jane Doe, John Smith",
            "pub_date": "2023-01-01",
            "abstract": "This preprint provides early access to research on oncogenic pathway variations."
        }

    # Extract clean DOI starting with 10.1101/
    match = re.search(r'(10\.1101/\S+)', doi)
    if not match:
        return {}
    clean_doi = match.group(1)

    try:
        url = f"https://api.biorxiv.org/details/biorxiv/{clean_doi}"
        res = await _make_biorxiv_request(client, url)
        
        # bioRxiv API returns list under "collection"
        collection = res.get("collection", [])
        if collection:
            # Get the latest version (usually the last in the list, or we can take the first)
            paper = collection[-1]
            return {
                "doi": paper.get("doi", clean_doi),
                "title": paper.get("title") or "Untitled bioRxiv Preprint",
                "authors": paper.get("authors") or "Unknown Authors",
                "pub_date": paper.get("date") or "",
                "abstract": paper.get("abstract") or ""
            }
    except Exception as e:
        logger.error(f"Error querying bioRxiv for DOI {clean_doi}: {str(e)}")
        
    return {}

async def fetch_biorxiv_preprints_for_dois(client: httpx.AsyncClient, doi_list: list, mock_mode: bool = True) -> list:
    """
    Fetch multiple bioRxiv preprints in parallel for a list of DOIs.
    """
    if not doi_list:
        return []
    
    # Identify bioRxiv DOIs (containing 10.1101)
    biorxiv_dois = []
    for doi in doi_list:
        if doi and "10.1101" in doi:
            biorxiv_dois.append(doi)
            
    # Remove duplicates
    biorxiv_dois = list(set(biorxiv_dois))
    
    if not biorxiv_dois:
        return []
        
    # Query concurrently
    tasks = [get_biorxiv_preprint(client, doi, mock_mode) for doi in biorxiv_dois]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    preprints = []
    for res in results:
        if isinstance(res, dict) and res.get("doi"):
            preprints.append(res)
            
    return preprints
