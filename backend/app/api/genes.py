import asyncio
import logging
from typing import List
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services import ensembl_service, uniprot_service, opentargets_service

logger = logging.getLogger(__name__)
router = APIRouter()

class EnsemblTranscript(BaseModel):
    transcript_id: str
    length: int

class EnsemblData(BaseModel):
    gene_id: str
    transcripts: List[EnsemblTranscript]

class UniProtData(BaseModel):
    accession: str
    name: str
    sequence: str

class OpenTargetsAssociation(BaseModel):
    disease_id: str
    disease_name: str
    score: float

class OpenTargetsGeneData(BaseModel):
    target_id: str
    associations: List[OpenTargetsAssociation]

class GeneResponse(BaseModel):
    symbol: str
    ensembl: EnsemblData
    uniprot: UniProtData
    opentargets: OpenTargetsGeneData

@router.get("/{symbol}", response_model=GeneResponse)
async def get_gene(symbol: str, request: Request):
    client = request.app.state.http_client
    mock_mode = settings.mock_mode

    # Fetch Ensembl and UniProt in parallel
    results = await asyncio.gather(
        ensembl_service.get_gene_data(client, symbol, mock_mode),
        uniprot_service.get_uniprot_data(client, symbol, mock_mode),
        return_exceptions=True
    )

    ensembl_data = results[0]
    if isinstance(ensembl_data, Exception):
        logger.error(f"Ensembl query exception: {str(ensembl_data)}")
        ensembl_data = {"gene_id": "", "transcripts": []}

    uniprot_data = results[1]
    if isinstance(uniprot_data, Exception):
        logger.error(f"UniProt query exception: {str(uniprot_data)}")
        uniprot_data = {"accession": "", "name": "", "sequence": ""}

    # Extract gene ID for OpenTargets lookup
    gene_id = ensembl_data.get("gene_id")
    
    # Fetch OpenTargets using gene_id
    if gene_id:
        try:
            opentargets_data = await opentargets_service.get_gene_associations(client, gene_id, mock_mode)
        except Exception as e:
            logger.error(f"OpenTargets query exception: {str(e)}")
            opentargets_data = {"target_id": gene_id, "associations": []}
    else:
        opentargets_data = {"target_id": "", "associations": []}

    return {
        "symbol": symbol.upper(),
        "ensembl": ensembl_data,
        "uniprot": uniprot_data,
        "opentargets": opentargets_data
    }
