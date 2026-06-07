import asyncio
import logging
import httpx
import xml.etree.ElementTree as ET
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
pubmed_sem = asyncio.Semaphore(3)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_pubmed_request(client: httpx.AsyncClient, url: str, params: dict = None, return_xml: bool = False) -> str:
    async with pubmed_sem:
        response = await client.get(url, params=params, timeout=12.0)
        response.raise_for_status()
        return response.text if return_xml else response.json()

def _parse_pubmed_efetch_xml(xml_content: str) -> list:
    if not xml_content:
        return []
    try:
        root = ET.fromstring(xml_content)
        articles = []
        for article_node in root.findall(".//PubmedArticle"):
            pmid_node = article_node.find(".//PMID")
            pmid = pmid_node.text if pmid_node is not None else ""
            
            title_node = article_node.find(".//ArticleTitle")
            title = "".join(title_node.itertext()).strip() if title_node is not None else ""
            
            # Authors
            authors_list = []
            for auth in article_node.findall(".//AuthorList/Author"):
                last = auth.find("LastName")
                fore = auth.find("ForeName")
                last_str = last.text if last is not None else ""
                fore_str = fore.text if fore is not None else ""
                if last_str or fore_str:
                    authors_list.append(f"{fore_str} {last_str}".strip())
            authors = ", ".join(authors_list)
            
            # Journal
            journal_node = article_node.find(".//Journal/Title")
            if journal_node is None:
                journal_node = article_node.find(".//Journal/ISOAbbreviation")
            journal = journal_node.text if journal_node is not None else ""
            
            # Pub Date
            year_node = article_node.find(".//JournalIssue/PubDate/Year")
            month_node = article_node.find(".//JournalIssue/PubDate/Month")
            day_node = article_node.find(".//JournalIssue/PubDate/Day")
            year = year_node.text if year_node is not None else ""
            month = month_node.text if month_node is not None else ""
            day = day_node.text if day_node is not None else ""
            pub_date = "-".join([p for p in (year, month, day) if p])
            if not pub_date:
                medline_date = article_node.find(".//JournalIssue/PubDate/MedlineDate")
                pub_date = medline_date.text if medline_date is not None else ""
                
            # Abstract
            abstract_texts = []
            for abs_text in article_node.findall(".//Abstract/AbstractText"):
                abstract_texts.append("".join(abs_text.itertext()).strip())
            abstract = " ".join(abstract_texts)
            
            # DOI
            doi = ""
            for art_id in article_node.findall(".//ArticleIdList/ArticleId"):
                if art_id.attrib.get("IdType") == "doi":
                    doi = art_id.text or ""
                    break
                    
            articles.append({
                "pmid": pmid,
                "title": title,
                "authors": authors,
                "journal": journal,
                "pub_date": pub_date,
                "abstract": abstract,
                "doi": doi
            })
        return articles
    except Exception as e:
        logger.error(f"Failed to parse PubMed efetch XML: {str(e)}")
        return []

async def get_pubmed_articles(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> list:
    if mock_mode:
        # High fidelity mock articles
        return [
            {
                "pmid": "31234567",
                "title": f"Targeting {query.upper()} mutations in human malignancies: clinical updates",
                "authors": "John Doe, Jane Smith",
                "journal": "New England Journal of Medicine",
                "pub_date": "2023-05-12",
                "abstract": f"This study reviews clinical advances in treating patients with oncogenic {query.upper()} aberrations, showing significant improvements in progression-free survival.",
                "doi": "10.1056/NEJMoa1234567"
            },
            {
                "pmid": "32345678",
                "title": f"Resistance mechanisms to target therapies in {query.upper()} mutant cells",
                "authors": "Alice Johnson, Bob Wilson",
                "journal": "Cancer Discovery",
                "pub_date": "2024-02-28",
                "abstract": f"We characterize secondary mutations arising in {query.upper()} signaling pathways that confer resistance to selective kinase inhibitors.",
                "doi": "10.1101/2024.02.20.123456" # Mock bioRxiv DOI
            }
        ]

    try:
        # Step 1: esearch
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": 5
        }
        search_res = await _make_pubmed_request(client, search_url, search_params)
        id_list = search_res.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            return []
        
        # Step 2: efetch
        ids_param = ",".join(id_list)
        fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
        fetch_params = {
            "db": "pubmed",
            "id": ids_param,
            "retmode": "xml"
        }
        xml_content = await _make_pubmed_request(client, fetch_url, fetch_params, return_xml=True)
        return _parse_pubmed_efetch_xml(xml_content)
    except Exception as e:
        logger.error(f"Error querying PubMed for {query}: {str(e)}")
        return []
