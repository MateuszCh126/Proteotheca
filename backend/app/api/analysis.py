import logging
from typing import List, Optional
from fastapi import APIRouter, Request, File, UploadFile, Form, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services import foldseek_service, clustal_service, blast_service, pubchem_service, unibind_service

logger = logging.getLogger(__name__)
router = APIRouter()

class AlignRequest(BaseModel):
    sequences_fasta: str

class SimilarityRequest(BaseModel):
    sequence: str

@router.post("/structures/foldseek")
async def search_structure(request: Request, file: UploadFile = File(...)):
    """
    Submits a PDB/CIF file to Foldseek for 3D structure similarity search.
    """
    client = request.app.state.http_client
    mock_mode = settings.mock_mode
    try:
        content = await file.read()
        res = await foldseek_service.run_foldseek_search(client, content, file.filename, mock_mode)
        return res
    except Exception as e:
        logger.error(f"Error in foldseek endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to run structural search.")

@router.post("/sequence/align")
async def align_seqs(request: Request, payload: AlignRequest):
    """
    Performs multiple sequence alignment using EBI Clustal Omega.
    """
    client = request.app.state.http_client
    mock_mode = settings.mock_mode
    try:
        res = await clustal_service.align_sequences(client, payload.sequences_fasta, mock_mode)
        return res
    except Exception as e:
        logger.error(f"Error in align endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to align sequences.")

@router.post("/sequence/similarity")
async def search_similarity(request: Request, payload: SimilarityRequest):
    """
    Searches for sequence similarity using BLAST/MMseqs2.
    """
    client = request.app.state.http_client
    mock_mode = settings.mock_mode
    try:
        res = await blast_service.run_blast_search(client, payload.sequence, mock_mode)
        return res
    except Exception as e:
        logger.error(f"Error in similarity endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform sequence similarity search.")

@router.get("/compounds/{query}")
async def get_compound(query: str, request: Request):
    """
    Retrieves chemical compound properties from PubChem.
    """
    client = request.app.state.http_client
    mock_mode = settings.mock_mode
    try:
        res = await pubchem_service.get_compound_data(client, query, mock_mode)
        return res
    except Exception as e:
        logger.error(f"Error in compound endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch compound data.")

@router.get("/tfbs/unibind/{tf_name}")
async def get_unibind(tf_name: str, request: Request):
    """
    Retrieves experimentally validated TF binding datasets from UniBind.
    """
    client = request.app.state.http_client
    mock_mode = settings.mock_mode
    try:
        res = await unibind_service.get_unibind_datasets(client, tf_name, mock_mode)
        return res
    except Exception as e:
        logger.error(f"Error in unibind endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch UniBind datasets.")
