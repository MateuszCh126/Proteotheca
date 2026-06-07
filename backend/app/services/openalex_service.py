import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
openalex_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_openalex_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with openalex_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

def _reconstruct_abstract(inverted_index: dict) -> str:
    if not inverted_index:
        return ""
    try:
        max_idx = -1
        for positions in inverted_index.values():
            for pos in positions:
                if pos > max_idx:
                    max_idx = pos
        if max_idx == -1:
            return ""
        
        words = [""] * (max_idx + 1)
        for word, positions in inverted_index.items():
            for pos in positions:
                if 0 <= pos < len(words):
                    words[pos] = word
        return " ".join([w for w in words if w is not None]).strip()
    except Exception as e:
        logger.error(f"Error reconstructing abstract from inverted index: {str(e)}")
        return ""

async def get_openalex_articles(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> list:
    if mock_mode:
        return [
            {
                "id": "https://openalex.org/W4000000001",
                "title": f"Molecular dynamics of {query} pathways in oncogenesis",
                "authors": "Carol Danvers, Bruce Banner",
                "pub_date": "2023-11-15",
                "abstract": f"This study explores the detailed molecular dynamics of {query} activation loop changes, providing insights into structural configurations.",
                "doi": "https://doi.org/10.1016/j.jmb.2023.100100"
            }
        ]

    try:
        url = "https://api.openalex.org/works"
        params = {
            "search": query,
            "per_page": 5,
            # Be polite to OpenAlex API
            "mailto": "admin@example.com"
        }
        res = await _make_openalex_request(client, url, params=params)
        results = res.get("results", [])
        
        articles = []
        for work in results:
            work_id = work.get("id", "")
            title = work.get("title") or "Untitled Work"
            
            # Extract authors
            authorships = work.get("authorships", [])
            authors_list = []
            for auth in authorships:
                author_name = auth.get("author", {}).get("display_name")
                if author_name:
                    authors_list.append(author_name)
            authors = ", ".join(authors_list)
            
            pub_date = work.get("publication_date") or ""
            
            # Reconstruct abstract
            inv_index = work.get("abstract_inverted_index", {})
            abstract = _reconstruct_abstract(inv_index)
            
            doi = work.get("doi") or ""
            
            articles.append({
                "id": work_id,
                "title": title,
                "authors": authors,
                "pub_date": pub_date,
                "abstract": abstract,
                "doi": doi
            })
        return articles
    except Exception as e:
        logger.error(f"Error querying OpenAlex for {query}: {str(e)}")
        return []
