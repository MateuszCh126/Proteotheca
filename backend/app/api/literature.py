import asyncio
import logging
from typing import List
from fastapi import APIRouter, Request, Query
from pydantic import BaseModel

from app.config import settings
from app.services import pubmed_service, openalex_service, biorxiv_service

logger = logging.getLogger(__name__)
router = APIRouter()

class PubmedArticleResponse(BaseModel):
    pmid: str
    title: str
    authors: str
    journal: str
    pub_date: str
    abstract: str
    doi: str

class BiorxivArticleResponse(BaseModel):
    doi: str
    title: str
    authors: str
    pub_date: str
    abstract: str

class OpenalexArticleResponse(BaseModel):
    id: str
    title: str
    authors: str
    pub_date: str
    abstract: str
    doi: str

class LiteratureResponse(BaseModel):
    query: str
    pubmed: List[PubmedArticleResponse]
    biorxiv: List[BiorxivArticleResponse]
    openalex: List[OpenalexArticleResponse]

@router.get("", response_model=LiteratureResponse)
async def get_literature(query: str = Query(..., description="Query term for literature search"), request: Request = None):
    client = request.app.state.http_client
    mock_mode = settings.mock_mode

    # Fetch PubMed and OpenAlex in parallel
    results = await asyncio.gather(
        pubmed_service.get_pubmed_articles(client, query, mock_mode),
        openalex_service.get_openalex_articles(client, query, mock_mode),
        return_exceptions=True
    )

    pubmed_data = results[0]
    if isinstance(pubmed_data, Exception):
        logger.error(f"PubMed query exception: {str(pubmed_data)}")
        pubmed_data = []

    openalex_data = results[1]
    if isinstance(openalex_data, Exception):
        logger.error(f"OpenAlex query exception: {str(openalex_data)}")
        openalex_data = []

    # Gather DOIs from both sources to identify bioRxiv papers
    doi_list = []
    for art in pubmed_data:
        doi = art.get("doi")
        if doi:
            doi_list.append(doi)
    for art in openalex_data:
        doi = art.get("doi")
        if doi:
            doi_list.append(doi)

    # Fetch bioRxiv preprint details for any matching DOIs
    try:
        biorxiv_data = await biorxiv_service.fetch_biorxiv_preprints_for_dois(client, doi_list, mock_mode)
    except Exception as e:
        logger.error(f"bioRxiv query exception: {str(e)}")
        biorxiv_data = []

    return {
        "query": query,
        "pubmed": pubmed_data,
        "biorxiv": biorxiv_data,
        "openalex": openalex_data
    }
