import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)
chembl_sem = asyncio.Semaphore(5)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, min=1, max=5),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
    reraise=True
)
async def _make_chembl_request(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    async with chembl_sem:
        response = await client.get(url, params=params, timeout=12.0)
        response.raise_for_status()
        return response.json()

async def get_active_compounds(client: httpx.AsyncClient, disease_name: str, mock_mode: bool = True) -> dict:
    if mock_mode:
        disease_lower = disease_name.lower()
        mock_data = {
            "melanoma": {
                "active_compounds": [
                    {"chembl_id": "CHEMBL2103830", "name": "DABRAFENIB", "ic50_nm": 0.8},
                    {"chembl_id": "CHEMBL259013", "name": "VEMURAFENIB", "ic50_nm": 12.0}
                ]
            },
            "breast cancer": {
                "active_compounds": [
                    {"chembl_id": "CHEMBL506", "name": "TAMOXIFEN", "ic50_nm": 15.0},
                    {"chembl_id": "CHEMBL1201585", "name": "TRASTUZUMAB", "ic50_nm": 5.5}
                ]
            },
            "lung cancer": {
                "active_compounds": [
                    {"chembl_id": "CHEMBL28357", "name": "GEFITINIB", "ic50_nm": 3.2},
                    {"chembl_id": "CHEMBL1489", "name": "ERLOTINIB", "ic50_nm": 2.1},
                    {"chembl_id": "CHEMBL3137343", "name": "OSIMERTINIB", "ic50_nm": 0.6},
                    {"chembl_id": "CHEMBL3813872", "name": "ALECTINIB", "ic50_nm": 1.8}
                ]
            }
        }
        for k, v in mock_data.items():
            if k in disease_lower or disease_lower in k:
                return v
        return {
            "active_compounds": [
                {"chembl_id": "CHEMBL123", "name": "MOCK COMPOUND A", "ic50_nm": 10.5}
            ]
        }

    try:
        # Step 1: Query drug_indications for efo_term
        url_ind = "https://www.ebi.ac.uk/chembl/api/data/drug_indication"
        params_ind = {
            "format": "json",
            "efo_term__icontains": disease_name,
            "limit": 10
        }
        res_ind = await _make_chembl_request(client, url_ind, params_ind)
        indications = res_ind.get("drug_indications", [])
        
        # Fallback to mesh_heading
        if not indications:
            params_ind = {
                "format": "json",
                "mesh_heading__icontains": disease_name,
                "limit": 10
            }
            res_ind = await _make_chembl_request(client, url_ind, params_ind)
            indications = res_ind.get("drug_indications", [])
            
        chembl_ids = list(set([ind.get("parent_key") for ind in indications if ind.get("parent_key")]))
        if not chembl_ids:
            return {"active_compounds": []}
        
        # Limit to 5 compounds to keep request size small
        chembl_ids = chembl_ids[:5]
        ids_query = ",".join(chembl_ids)
        
        # Step 2: Get molecule details
        url_mol = "https://www.ebi.ac.uk/chembl/api/data/molecule"
        params_mol = {
            "format": "json",
            "molecule_chembl_id__in": ids_query
        }
        res_mol = await _make_chembl_request(client, url_mol, params_mol)
        molecules = res_mol.get("molecules", [])
        
        mol_names = {}
        for mol in molecules:
            cid = mol.get("molecule_chembl_id")
            pref_name = mol.get("pref_name")
            if cid:
                mol_names[cid] = pref_name or cid.upper()
                
        # Step 3: Get activities (IC50) for these molecules
        url_act = "https://www.ebi.ac.uk/chembl/api/data/activity"
        params_act = {
            "format": "json",
            "molecule_chembl_id__in": ids_query,
            "standard_type": "IC50",
            "limit": 50
        }
        res_act = await _make_chembl_request(client, url_act, params_act)
        activities = res_act.get("activities", [])
        
        # Aggregate IC50 values per molecule
        mol_ic50s = {}
        for act in activities:
            cid = act.get("molecule_chembl_id")
            val = act.get("standard_value")
            if cid and val is not None:
                try:
                    val_float = float(val)
                    if val_float > 0:
                        if cid not in mol_ic50s:
                            mol_ic50s[cid] = []
                        mol_ic50s[cid].append(val_float)
                except ValueError:
                    continue
        
        active_compounds = []
        for cid in chembl_ids:
            name = mol_names.get(cid, cid.upper())
            ic50_list = mol_ic50s.get(cid, [])
            # Take median of IC50 or default to 10.0 if not found
            if ic50_list:
                ic50_list.sort()
                median_ic50 = ic50_list[len(ic50_list)//2]
            else:
                median_ic50 = 10.0
                
            active_compounds.append({
                "chembl_id": cid,
                "name": name,
                "ic50_nm": round(median_ic50, 2)
            })
            
        return {"active_compounds": active_compounds}
    except Exception as e:
        logger.error(f"Error querying ChEMBL for disease {disease_name}: {str(e)}")
        return {"active_compounds": []}
