import asyncio
import logging
import httpx
import xml.etree.ElementTree as ET
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
arxiv_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_arxiv_request(client: httpx.AsyncClient, url: str) -> str:
    async with arxiv_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.text

async def get_arxiv_articles(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> list:
    if mock_mode:
        # High fidelity arXiv response mock
        return [
            {
                "id": "arXiv:2104.09506",
                "title": f"Structural modeling and deep learning of {query} pathways",
                "authors": "A. Smith, B. Jones",
                "pub_date": "2021-04-19",
                "abstract": f"This study explores deep learning models applied to {query} pathways.",
                "doi": "10.48550/arXiv.2104.09506"
            }
        ]

    try:
        url = f"https://export.arxiv.org/api/query?search_query=all:{query}&max_results=3"
        xml_text = await _make_arxiv_request(client, url)
        
        # Parse XML
        root = ET.fromstring(xml_text)
        articles = []
        
        # namespaces
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        for entry in root.findall('atom:entry', ns):
            arxiv_id = entry.find('atom:id', ns).text.split('/abs/')[-1]
            title = entry.find('atom:title', ns).text.strip().replace("\n", " ")
            abstract = entry.find('atom:summary', ns).text.strip().replace("\n", " ")
            pub_date = entry.find('atom:published', ns).text[:10]
            
            authors = ", ".join([author.find('atom:name', ns).text for author in entry.findall('atom:author', ns)])
            
            articles.append({
                "id": f"arXiv:{arxiv_id}",
                "title": title,
                "authors": authors,
                "pub_date": pub_date,
                "abstract": abstract,
                "doi": f"10.48550/arXiv.{arxiv_id}"
            })
        return articles
    except Exception as e:
        logger.error(f"Error querying arXiv for {query}: {str(e)}")

    return []
