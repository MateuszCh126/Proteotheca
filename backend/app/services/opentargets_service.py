import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
opentargets_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_opentargets_graphql_request(client: httpx.AsyncClient, query: str, variables: dict) -> dict:
    async with opentargets_sem:
        url = "https://api.platform.opentargets.org/api/v4/graphql"
        payload = {"query": query, "variables": variables}
        response = await client.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_gene_associations(client: httpx.AsyncClient, ensembl_id: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        mock_data = {
            "ENSG00000157764": {
                "target_id": "ENSG00000157764",
                "associations": [
                    {"disease_id": "EFO_0000616", "disease_name": "melanoma", "score": 0.95},
                    {"disease_id": "EFO_0000305", "disease_name": "colorectal cancer", "score": 0.85}
                ]
            },
            "ENSG00000146648": {
                "target_id": "ENSG00000146648",
                "associations": [
                    {"disease_id": "EFO_0000571", "disease_name": "lung carcinoma", "score": 0.92},
                    {"disease_id": "EFO_0000311", "disease_name": "glioblastoma", "score": 0.78}
                ]
            },
            "ENSG00000141510": {
                "target_id": "ENSG00000141510",
                "associations": [
                    {"disease_id": "EFO_0000311", "disease_name": "glioblastoma", "score": 0.88},
                    {"disease_id": "EFO_0000305", "disease_name": "colorectal cancer", "score": 0.82}
                ]
            }
        }
        if ensembl_id in mock_data:
            return mock_data[ensembl_id]
        else:
            return {
                "target_id": ensembl_id,
                "associations": [
                    {"disease_id": "EFO_0000001", "disease_name": "experimental disease", "score": 0.50}
                ]
            }

    try:
        query = """
        query TargetAssociations($ensemblId: String!) {
          target(id: $ensemblId) {
            id
            associatedDiseases(page: {index: 0, size: 20}) {
              rows {
                disease {
                  id
                  name
                }
                score
              }
            }
          }
        }
        """
        variables = {"ensemblId": ensembl_id}
        res = await _make_opentargets_graphql_request(client, query, variables)
        target_data = res.get("data", {}).get("target")
        if target_data:
            assoc_rows = target_data.get("associatedDiseases", {}).get("rows", [])
            associations = []
            for row in assoc_rows:
                disease = row.get("disease", {})
                score = row.get("score", 0.0)
                if disease:
                    associations.append({
                        "disease_id": disease.get("id", ""),
                        "disease_name": disease.get("name", ""),
                        "score": round(score, 4)
                    })
            return {
                "target_id": ensembl_id,
                "associations": associations
            }
    except Exception as e:
        logger.error(f"Error querying OpenTargets for gene {ensembl_id}: {str(e)}")

    return {
        "target_id": ensembl_id,
        "associations": []
    }

async def get_disease_associations(client: httpx.AsyncClient, disease_name: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        disease_name_lower = disease_name.lower()
        mock_data = {
            "melanoma": {
                "associated_genes": [
                    {"symbol": "BRAF", "score": 0.95},
                    {"symbol": "NRAS", "score": 0.88},
                    {"symbol": "KIT", "score": 0.72}
                ]
            },
            "breast cancer": {
                "associated_genes": [
                    {"symbol": "BRCA1", "score": 0.98},
                    {"symbol": "BRCA2", "score": 0.97},
                    {"symbol": "PIK3CA", "score": 0.85}
                ]
            }
        }
        for k, v in mock_data.items():
            if k in disease_name_lower or disease_name_lower in k:
                return v
        return {
            "associated_genes": [
                {"symbol": "GENE1", "score": 0.50}
            ]
        }

    try:
        # Step 1: Search disease by name
        search_query = """
        query SearchDisease($queryString: String!) {
          search(queryString: $queryString, entityNames: ["disease"], page: {index: 0, size: 5}) {
            hits {
              id
              name
            }
          }
        }
        """
        search_vars = {"queryString": disease_name}
        search_res = await _make_opentargets_graphql_request(client, search_query, search_vars)
        hits = search_res.get("data", {}).get("search", {}).get("hits", [])
        if not hits:
            return {"associated_genes": []}
        
        disease_id = hits[0].get("id")
        
        # Step 2: Query associations for that disease ID
        assoc_query = """
        query DiseaseAssociations($diseaseId: String!) {
          disease(id: $diseaseId) {
            id
            associatedTargets(page: {index: 0, size: 20}) {
              rows {
                target {
                  approvedSymbol
                }
                score
              }
            }
          }
        }
        """
        assoc_vars = {"diseaseId": disease_id}
        assoc_res = await _make_opentargets_graphql_request(client, assoc_query, assoc_vars)
        disease_data = assoc_res.get("data", {}).get("disease")
        if disease_data:
            assoc_rows = disease_data.get("associatedTargets", {}).get("rows", [])
            associated_genes = []
            for row in assoc_rows:
                target = row.get("target", {})
                score = row.get("score", 0.0)
                if target:
                    symbol = target.get("approvedSymbol", "")
                    if symbol:
                        associated_genes.append({
                            "symbol": symbol,
                            "score": round(score, 4)
                        })
            return {"associated_genes": associated_genes}
    except Exception as e:
        logger.error(f"Error querying OpenTargets for disease {disease_name}: {str(e)}")

    return {"associated_genes": []}
