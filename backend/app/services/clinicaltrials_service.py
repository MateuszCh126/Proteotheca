import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
clinicaltrials_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_clinicaltrials_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with clinicaltrials_sem:
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json()

def _map_status(raw: str) -> str:
    if not raw:
        return "UNKNOWN"
    raw_lower = raw.lower()
    if "completed" in raw_lower:
        return "COMPLETED"
    elif "not yet recruiting" in raw_lower:
        return "NOT_YET_RECRUITING"
    elif "recruiting" in raw_lower:
        return "RECRUITING"
    elif "active, not recruiting" in raw_lower or "active" in raw_lower:
        return "ACTIVE_NOT_RECRUITING"
    elif "terminated" in raw_lower:
        return "TERMINATED"
    else:
        return "UNKNOWN"

async def get_clinical_trials(client: httpx.AsyncClient, disease_name: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        disease_lower = disease_name.lower()
        mock_data = {
            "melanoma": {
                "trial_count": 142,
                "trials": [
                    {
                        "nct_id": "NCT01227889",
                        "title": "Study of Dabrafenib in Patients With BRAF Mutation-Positive Melanoma",
                        "status": "COMPLETED"
                    },
                    {
                        "nct_id": "NCT02227889",
                        "title": "Combination of Dabrafenib and Trametinib in Melanoma Patients",
                        "status": "RECRUITING"
                    }
                ]
            },
            "breast cancer": {
                "trial_count": 89,
                "trials": [
                    {
                        "nct_id": "NCT01234567",
                        "title": "A Study of Trastuzumab in Patients With HER2-Positive Breast Cancer",
                        "status": "RECRUITING"
                    }
                ]
            }
        }
        for k, v in mock_data.items():
            if k in disease_lower or disease_lower in k:
                return v
        return {
            "trial_count": 10,
            "trials": [
                {
                    "nct_id": "NCT00000000",
                    "title": f"Investigational Treatment for {disease_name.capitalize()}",
                    "status": "RECRUITING"
                }
            ]
        }

    try:
        url = "https://clinicaltrials.gov/api/v2/studies"
        params = {
            "query.cond": disease_name,
            "pageSize": 10
        }
        res = await _make_clinicaltrials_request(client, url, params=params)
        
        # API v2 structure
        total_count = res.get("totalCount", 0)
        studies = res.get("studies", [])
        
        trials = []
        for study in studies:
            protocol = study.get("protocolSection", {})
            ident = protocol.get("identificationModule", {})
            status_mod = protocol.get("statusModule", {})
            
            nct_id = ident.get("nctId", "")
            title = ident.get("officialTitle") or ident.get("briefTitle") or "Untitled Study"
            status_raw = status_mod.get("overallStatus", "")
            
            if nct_id:
                trials.append({
                    "nct_id": nct_id,
                    "title": title,
                    "status": _map_status(status_raw)
                })
                
        return {
            "trial_count": total_count if total_count > 0 else len(trials),
            "trials": trials
        }
    except Exception as e:
        logger.error(f"Error querying ClinicalTrials.gov for disease {disease_name}: {str(e)}")
        return {
            "trial_count": 0,
            "trials": []
        }
