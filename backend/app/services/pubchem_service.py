import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
pubchem_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_pubchem_request(client: httpx.AsyncClient, url: str) -> dict:
    async with pubchem_sem:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

async def get_compound_data(client: httpx.AsyncClient, query: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        # High fidelity PubChem response mock
        return {
            "cid": 16124688 if query.upper() == "DABRAFENIB" else 12345,
            "name": query.upper(),
            "smiles": "CC(C)(C)C1=NC(=C(S1)C2=NC(=NC=C2)N)C3=C(C(=CC=C3)F)S(=O)(=O)NC4=C(C=C(C=C4)F)F" if query.upper() == "DABRAFENIB" else "CC",
            "formula": "C23H20F3N5O2S2" if query.upper() == "DABRAFENIB" else "C2H6",
            "molecular_weight": 519.6 if query.upper() == "DABRAFENIB" else 30.07,
            "iupac_name": "N-[3-[5-(2-aminopyrimidin-4-yl)-2-tert-butyl-1,3-thiazol-4-yl]-2-fluorophenyl]-2,6-difluorobenzenesulfonamide" if query.upper() == "DABRAFENIB" else "ethane"
        }

    try:
        # Check if query is numeric (CID)
        if query.isdigit():
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{query}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON"
        else:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{query}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON"
            
        data = await _make_pubchem_request(client, url)
        properties = data.get("PropertyTable", {}).get("Properties", [{}])[0]
        
        return {
            "cid": properties.get("CID"),
            "name": query.upper(),
            "smiles": properties.get("CanonicalSMILES", ""),
            "formula": properties.get("MolecularFormula", ""),
            "molecular_weight": properties.get("MolecularWeight"),
            "iupac_name": properties.get("IUPACName", "")
        }
    except Exception as e:
        logger.error(f"Error querying PubChem for {query}: {str(e)}")

    return {
        "cid": 0,
        "name": query,
        "smiles": "",
        "formula": "",
        "molecular_weight": 0.0,
        "iupac_name": ""
    }
