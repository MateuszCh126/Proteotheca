import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
openfda_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_openfda_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with openfda_sem:
        response = await client.get(url, params=params, timeout=10.0)
        # 444 or 404 is returned by openFDA when no records are found, handle gracefully
        if response.status_code == 404:
            return {}
        response.raise_for_status()
        return response.json()

async def get_openfda_data(client: httpx.AsyncClient, disease_name: str, active_substance: str = "", mock_mode: bool = True) -> dict:
    if mock_mode:
        disease_lower = disease_name.lower()
        substance = active_substance or ("DABRAFENIB" if "melanoma" in disease_lower else "TAMOXIFEN" if "breast" in disease_lower else "MOCK DRUG")
        return {
            "active_substance": substance,
            "total_reports": 1024 if "melanoma" in disease_lower else 2048,
            "events": [
                {"term": "Fatigue", "count": 250},
                {"term": "Neutropenia", "count": 180},
                {"term": "Nausea", "count": 140},
                {"term": "Alopecia", "count": 90},
                {"term": "Headache", "count": 60}
            ],
            "sex_breakdown": [
                {"name": "Male", "value": 450},
                {"name": "Female", "value": 550},
                {"name": "Unknown", "value": 24}
            ],
            "age_breakdown": [
                {"name": "Adult", "value": 600},
                {"name": "Elderly", "value": 300},
                {"name": "Child/Adolescent", "value": 124}
            ]
        }

    # If no active substance is passed, we default to a drug commonly associated with the disease,
    # or query by disease indication directly. Let's use disease_name in drugindication search.
    query_term = f'patient.drug.drugindication:"{disease_name}"'
    if active_substance:
        query_term = f'patient.drug.medicinalproduct:"{active_substance}"'

    try:
        base_url = "https://api.fda.gov/drug/event.json"
        
        # 1. Query total reports count
        res_total = await _make_openfda_request(client, base_url, {"search": query_term, "limit": 1})
        total_reports = res_total.get("meta", {}).get("results", {}).get("total", 0)
        
        if total_reports == 0:
            # Try without quotes if zero matches
            query_term_fallback = f'patient.drug.drugindication:{disease_name}'
            res_total = await _make_openfda_request(client, base_url, {"search": query_term_fallback, "limit": 1})
            total_reports = res_total.get("meta", {}).get("results", {}).get("total", 0)
            if total_reports > 0:
                query_term = query_term_fallback

        if total_reports == 0:
            return {
                "active_substance": active_substance or disease_name.upper(),
                "total_reports": 0,
                "events": [],
                "sex_breakdown": [],
                "age_breakdown": []
            }

        # 2. Query top reaction terms
        res_reactions = await _make_openfda_request(client, base_url, {
            "search": query_term,
            "count": "patient.reaction.reactionmeddrapt.exact",
            "limit": 10
        })
        raw_events = res_reactions.get("results", [])
        events = [{"term": item.get("term", "").capitalize(), "count": item.get("count", 0)} for item in raw_events]

        # 3. Query sex breakdown
        res_sex = await _make_openfda_request(client, base_url, {
            "search": query_term,
            "count": "patient.patientsex"
        })
        raw_sex = res_sex.get("results", [])
        sex_map = {"1": "Male", "2": "Female", "0": "Unknown"}
        sex_breakdown = []
        for item in raw_sex:
            term = str(item.get("term", ""))
            sex_breakdown.append({
                "name": sex_map.get(term, "Unknown"),
                "value": item.get("count", 0)
            })

        # 4. Query age group breakdown
        res_age = await _make_openfda_request(client, base_url, {
            "search": query_term,
            "count": "patient.patientagegroup"
        })
        raw_age = res_age.get("results", [])
        age_map = {
            "1": "Neonate",
            "2": "Infant",
            "3": "Child",
            "4": "Adolescent",
            "5": "Adult",
            "6": "Elderly"
        }
        age_breakdown = []
        for item in raw_age:
            term = str(item.get("term", ""))
            age_breakdown.append({
                "name": age_map.get(term, "Unknown/Other"),
                "value": item.get("count", 0)
            })

        # Prettify the age breakdown by grouping if they are too granular, but mapping is fine
        return {
            "active_substance": active_substance or disease_name.upper(),
            "total_reports": total_reports,
            "events": events,
            "sex_breakdown": sex_breakdown,
            "age_breakdown": age_breakdown
        }
    except Exception as e:
        logger.error(f"Error querying openFDA for disease {disease_name}: {str(e)}")
        return {
            "active_substance": active_substance or disease_name.upper(),
            "total_reports": 0,
            "events": [],
            "sex_breakdown": [],
            "age_breakdown": []
        }
