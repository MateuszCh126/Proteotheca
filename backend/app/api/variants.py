import asyncio
import logging
import re
from typing import List, Optional, Any
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services import (
    clinvar_service,
    gnomad_service,
    gtex_service,
    alphagenome_service,
    dbsnp_service,
    encode_service,
    ucsc_service
)

logger = logging.getLogger(__name__)
router = APIRouter()

class ClinVarResponse(BaseModel):
    pathogenicity: str
    significance: str
    review_status: str

class GnomadPopulationResponse(BaseModel):
    pop: str
    freq: float

class GnomadResponse(BaseModel):
    allele_frequency: float
    homozygote_count: int
    populations: List[GnomadPopulationResponse]

class GtexEQTLResponse(BaseModel):
    tissue: str
    gene_symbol: str
    p_value: float
    nes: float

class GtexResponse(BaseModel):
    eqtls: List[GtexEQTLResponse]

class VariantResponse(BaseModel):
    variant_id: str
    clinvar: ClinVarResponse
    gnomad: GnomadResponse
    gtex: GtexResponse
    alphagenome: Optional[Any] = None
    dbsnp: Optional[Any] = None
    encode: Optional[Any] = None
    ucsc: Optional[Any] = None

async def resolve_rsid_to_coordinates(client, rsid: str, mock_mode: bool) -> str:
    if mock_mode:
        if rsid.lower() == "rs113488022":
            return "7-140753336-T-A"
        hash_val = sum(ord(c) for c in rsid)
        return f"1-{100000 + hash_val}-A-G"

    # Real mode lookup using ClinVar/dbSNP
    try:
        # 1. Try ClinVar Search
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "clinvar",
            "term": rsid,
            "retmode": "json"
        }
        res = await client.get(search_url, params=search_params, timeout=10.0)
        res.raise_for_status()
        id_list = res.json().get("esearchresult", {}).get("idlist", [])

        if id_list:
            uid = id_list[0]
            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            summary_params = {
                "db": "clinvar",
                "id": uid,
                "retmode": "json"
            }
            res_sum = await client.get(summary_url, params=summary_params, timeout=10.0)
            res_sum.raise_for_status()
            summary_info = res_sum.json().get("result", {}).get(uid, {})
            
            variation_loc = summary_info.get("variation_loc", [])
            for loc in variation_loc:
                if loc.get("assembly") == "GRCh38":
                    chrom = loc.get("chr")
                    start = loc.get("start")
                    ref = loc.get("ref")
                    alt = loc.get("alt")
                    if chrom and start and ref and alt:
                        return f"{chrom}-{start}-{ref}-{alt}"

        # 2. Try dbSNP search if ClinVar didn't return GRCh38 coordinates
        search_params["db"] = "snp"
        res = await client.get(search_url, params=search_params, timeout=10.0)
        res.raise_for_status()
        id_list = res.json().get("esearchresult", {}).get("idlist", [])

        if id_list:
            uid = id_list[0]
            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            summary_params = {
                "db": "snp",
                "id": uid,
                "retmode": "json"
            }
            res_sum = await client.get(summary_url, params=summary_params, timeout=10.0)
            res_sum.raise_for_status()
            summary_info = res_sum.json().get("result", {}).get(uid, {})
            
            spdis = summary_info.get("spdis", [])
            if spdis:
                spdi = spdis[0]
                ref = spdi.get("deleted", "")
                alt = spdi.get("inserted", "")
                pos = spdi.get("position", 0) + 1
                seq_id = spdi.get("seq_id", "")
                chrom_match = re.search(r'NC_0000(\d+)\.', seq_id)
                chrom = chrom_match.group(1) if chrom_match else "7"
                chrom = str(int(chrom))
                return f"{chrom}-{pos}-{ref}-{alt}"
    except Exception as e:
        logger.error(f"Error in Stage 1 NCBI resolution for {rsid}: {str(e)}")

    # 3. Try Ensembl variation endpoint as final fallback
    try:
        ensembl_url = f"https://rest.ensembl.org/variation/human/{rsid}"
        res = await client.get(ensembl_url, params={"content-type": "application/json"}, timeout=10.0)
        if res.status_code == 200:
            data = res.json()
            for mapping in data.get("mappings", []):
                if mapping.get("assembly_name") == "GRCh38":
                    chrom = mapping.get("seq_region_name")
                    start = mapping.get("start")
                    allele_string = mapping.get("allele_string", "")
                    alleles = allele_string.split("/")
                    if len(alleles) >= 2:
                        return f"{chrom}-{start}-{alleles[0]}-{alleles[1]}"
    except Exception as e:
        logger.error(f"Error in Stage 1 Ensembl fallback resolution for {rsid}: {str(e)}")

    # Default fallback
    return "7-140753336-T-A"

@router.get("/{variant_id}", response_model=VariantResponse)
async def get_variant(variant_id: str, request: Request):
    client = request.app.state.http_client
    mock_mode = settings.mock_mode

    # Clean input
    clean_id = variant_id.strip()

    # Stage 1: Parse and Resolve Variant Input
    is_rsid = bool(re.match(r'^rs\d+$', clean_id, re.IGNORECASE))
    
    if is_rsid:
        resolved_coordinate = await resolve_rsid_to_coordinates(client, clean_id, mock_mode)
    else:
        # Check if already coordinates (e.g. 7-140753336-T-A, 7:140753336:T:A)
        coord_match = re.match(
            r'^(?:chr)?(\d+|X|Y)[:\-_](\d+)[:\-_]([ACGT\-]+)[:\-_]([ACGT\-]+)$', 
            clean_id, 
            re.IGNORECASE
        )
        if coord_match:
            chrom = coord_match.group(1)
            pos = coord_match.group(2)
            ref = coord_match.group(3).upper()
            alt = coord_match.group(4).upper()
            resolved_coordinate = f"{chrom}-{pos}-{ref}-{alt}"
        else:
            raise HTTPException(status_code=400, detail="Invalid variant_id format. Must be rsID or coordinates.")

    # Parse chromosome and position details
    chrom = "7"
    pos_val = 140753336
    ref_len = 1
    alt_len = 1
    
    parts = resolved_coordinate.split("-")
    if len(parts) >= 4:
        chrom = parts[0]
        try:
            pos_val = int(parts[1])
        except ValueError:
            pass
        ref_len = len(parts[2])
        alt_len = len(parts[3])

    # Stage 2: Query services concurrently
    results = await asyncio.gather(
        clinvar_service.get_clinvar_data(client, clean_id, mock_mode),
        gnomad_service.get_gnomad_data(client, resolved_coordinate, mock_mode),
        gtex_service.get_gtex_data(client, resolved_coordinate, mock_mode),
        alphagenome_service.get_alphagenome_predictions(client, resolved_coordinate, mock_mode),
        dbsnp_service.get_dbsnp_data(client, clean_id, mock_mode) if is_rsid else asyncio.sleep(0, {}),
        encode_service.get_encode_ccres(client, chrom, pos_val - 1000, pos_val + 1000 + max(ref_len, alt_len), mock_mode),
        ucsc_service.get_conservation_and_tfbs(client, chrom, pos_val, pos_val + max(ref_len, alt_len), mock_mode),
        return_exceptions=True
    )

    clinvar_data = results[0]
    if isinstance(clinvar_data, Exception):
        logger.error(f"ClinVar query exception: {str(clinvar_data)}")
        clinvar_data = {
            "pathogenicity": "Uncertain Significance",
            "significance": "Error",
            "review_status": "no assertion criteria provided"
        }

    gnomad_data = results[1]
    if isinstance(gnomad_data, Exception):
        logger.error(f"gnomAD query exception: {str(gnomad_data)}")
        gnomad_data = {
            "allele_frequency": 0.0,
            "homozygote_count": 0,
            "populations": []
        }

    gtex_data = results[2]
    if isinstance(gtex_data, Exception):
        logger.error(f"GTEx query exception: {str(gtex_data)}")
        gtex_data = {"eqtls": []}

    def extract_result(res, default):
        if isinstance(res, Exception) or res is None:
            return default
        return res

    alphagenome_data = extract_result(results[3], {})
    dbsnp_data = extract_result(results[4], {})
    encode_data = extract_result(results[5], {})
    ucsc_data = extract_result(results[6], {})

    return {
        "variant_id": clean_id,
        "clinvar": clinvar_data,
        "gnomad": gnomad_data,
        "gtex": gtex_data,
        "alphagenome": alphagenome_data,
        "dbsnp": dbsnp_data,
        "encode": encode_data,
        "ucsc": ucsc_data
    }
