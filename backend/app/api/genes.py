import asyncio
import logging
from typing import List, Optional, Any
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services import (
    ensembl_service,
    uniprot_service,
    opentargets_service,
    alphafold_service,
    interpro_service,
    jaspar_service,
    ncbi_service,
    pdb_service,
    quickgo_service,
    reactome_service,
    string_service,
    hpa_service
)

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
    alphafold: Optional[Any] = None
    interpro: Optional[Any] = None
    jaspar: Optional[Any] = None
    ncbi_seq: Optional[Any] = None
    pdb_meta: Optional[Any] = None
    quickgo: Optional[Any] = None
    reactome: Optional[Any] = None
    string: Optional[Any] = None
    hpa: Optional[Any] = None

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

    gene_id = ensembl_data.get("gene_id")
    uniprot_acc = uniprot_data.get("accession")

    # Fetch all additional services concurrently
    additional_tasks = [
        opentargets_service.get_gene_associations(client, gene_id, mock_mode) if gene_id else asyncio.sleep(0, {}),
        alphafold_service.get_alphafold_data(client, uniprot_acc, mock_mode) if uniprot_acc else asyncio.sleep(0, {}),
        interpro_service.get_interpro_data(client, uniprot_acc, mock_mode) if uniprot_acc else asyncio.sleep(0, {}),
        jaspar_service.get_jaspar_profiles(client, symbol, mock_mode),
        ncbi_service.fetch_sequence(client, uniprot_acc or symbol, "protein", mock_mode),
        pdb_service.get_pdb_metadata(client, "1UWH", mock_mode),  # Default PDB ID for structural info
        quickgo_service.get_go_annotations(client, uniprot_acc, mock_mode) if uniprot_acc else asyncio.sleep(0, {}),
        reactome_service.get_reactome_pathways(client, uniprot_acc, mock_mode) if uniprot_acc else asyncio.sleep(0, {}),
        string_service.get_string_network(client, symbol, mock_mode),
        hpa_service.get_hpa_data(client, symbol, mock_mode)
    ]

    additional_results = await asyncio.gather(*additional_tasks, return_exceptions=True)

    def extract_result(res, default):
        if isinstance(res, Exception) or res is None:
            return default
        return res

    opentargets_data = extract_result(additional_results[0], {"target_id": gene_id or "", "associations": []})
    alphafold_data = extract_result(additional_results[1], {})
    interpro_data = extract_result(additional_results[2], {})
    jaspar_data = extract_result(additional_results[3], {})
    ncbi_seq_data = extract_result(additional_results[4], {})
    pdb_meta_data = extract_result(additional_results[5], {})
    quickgo_data = extract_result(additional_results[6], {})
    reactome_data = extract_result(additional_results[7], {})
    string_data = extract_result(additional_results[8], {})
    hpa_data = extract_result(additional_results[9], {})

    return {
        "symbol": symbol.upper(),
        "ensembl": ensembl_data,
        "uniprot": uniprot_data,
        "opentargets": opentargets_data,
        "alphafold": alphafold_data,
        "interpro": interpro_data,
        "jaspar": jaspar_data,
        "ncbi_seq": ncbi_seq_data,
        "pdb_meta": pdb_meta_data,
        "quickgo": quickgo_data,
        "reactome": reactome_data,
        "string": string_data,
        "hpa": hpa_data
    }
