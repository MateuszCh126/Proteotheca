import asyncio
import logging
from typing import List
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services import opentargets_service, chembl_service, clinicaltrials_service, openfda_service

logger = logging.getLogger(__name__)
router = APIRouter()

class OpenTargetsGeneResponse(BaseModel):
    symbol: str
    score: float

class OpenTargetsDiseaseResponse(BaseModel):
    associated_genes: List[OpenTargetsGeneResponse]

class ChEMBLCompoundResponse(BaseModel):
    chembl_id: str
    name: str
    ic50_nm: float

class ChEMBLResponse(BaseModel):
    active_compounds: List[ChEMBLCompoundResponse]

class ClinicalTrialResponse(BaseModel):
    nct_id: str
    title: str
    status: str

class ClinicalTrialsResponse(BaseModel):
    trial_count: int
    trials: List[ClinicalTrialResponse]

class AdverseEventResponse(BaseModel):
    term: str
    count: int

class DemographicResponse(BaseModel):
    name: str
    value: int

class OpenFdaResponse(BaseModel):
    active_substance: str
    total_reports: int
    events: List[AdverseEventResponse]
    sex_breakdown: List[DemographicResponse]
    age_breakdown: List[DemographicResponse]

class DiseaseResponse(BaseModel):
    disease_name: str
    opentargets: OpenTargetsDiseaseResponse
    chembl: ChEMBLResponse
    clinical_trials: ClinicalTrialsResponse
    openfda: OpenFdaResponse

@router.get("/{disease_name}", response_model=DiseaseResponse)
async def get_disease(disease_name: str, request: Request):
    client = request.app.state.http_client
    mock_mode = settings.mock_mode

    # Fetch OpenTargets, ChEMBL, and ClinicalTrials in parallel
    results = await asyncio.gather(
        opentargets_service.get_disease_associations(client, disease_name, mock_mode),
        chembl_service.get_active_compounds(client, disease_name, mock_mode),
        clinicaltrials_service.get_clinical_trials(client, disease_name, mock_mode),
        return_exceptions=True
    )

    opentargets_data = results[0]
    if isinstance(opentargets_data, Exception):
        logger.error(f"OpenTargets query exception: {str(opentargets_data)}")
        opentargets_data = {"associated_genes": []}

    chembl_data = results[1]
    if isinstance(chembl_data, Exception):
        logger.error(f"ChEMBL query exception: {str(chembl_data)}")
        chembl_data = {"active_compounds": []}

    clinical_trials_data = results[2]
    if isinstance(clinical_trials_data, Exception):
        logger.error(f"ClinicalTrials query exception: {str(clinical_trials_data)}")
        clinical_trials_data = {"trial_count": 0, "trials": []}

    # Extract the name of the first active compound to pass to openFDA
    active_substance = ""
    compounds = chembl_data.get("active_compounds", [])
    if compounds:
        active_substance = compounds[0].get("name", "")

    # Query openFDA with the extracted active substance
    try:
        openfda_data = await openfda_service.get_openfda_data(client, disease_name, active_substance, mock_mode)
    except Exception as e:
        logger.error(f"openFDA query exception: {str(e)}")
        openfda_data = {
            "active_substance": active_substance or disease_name.upper(),
            "total_reports": 0,
            "events": [],
            "sex_breakdown": [],
            "age_breakdown": []
        }

    return {
        "disease_name": disease_name.capitalize(),
        "opentargets": opentargets_data,
        "chembl": chembl_data,
        "clinical_trials": clinical_trials_data,
        "openfda": openfda_data
    }
