# Scope: Milestone 1 - Backend DB Services & APIs

## Architecture
- **Web Framework**: FastAPI (Python)
- **API Structure**: Modular router structure under `app/api/` matching defined endpoints.
- **Service Layer**: Dedicated service modules under `app/services/` for querying external biological and literature databases.
- **Data Integration**:
  - `Gene`: Ensembl, UniProt, OpenTargets
  - `Variant`: ClinVar, gnomAD, GTEx
  - `Disease/Indication`: OpenTargets, ChEMBL, ClinicalTrials.gov
  - `Literature`: PubMed, bioRxiv, OpenAlex
- **Testing**: Pytest unit/integration test suite with HTTP mocking for external API dependencies.

## Milestones & Tasks
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Database Service Clients | Implement external API query logic or mock aggregation logic in `app/services/` | None | PLANNED |
| 2 | FastAPI Application & Routers | Setup `main.py`, config, and endpoint routers in `app/api/` matching the required contracts | M1.1 | PLANNED |
| 3 | Pytest Test Suite | Write comprehensive mock tests verifying JSON schemas for all endpoints | M1.2 | PLANNED |
| 4 | Verification & Audit | Run tests, execute linting checks, and execute Forensic Auditor to confirm integrity | M1.3 | PLANNED |

## Interface Contracts

### 1. Gene Endpoint `/api/genes/{symbol}`
Response format as defined in PROJECT.md.

### 2. Variant Endpoint `/api/variants/{variant_id}`
Response format as defined in PROJECT.md.

### 3. Disease Endpoint `/api/diseases/{disease_name}`
Response format as defined in PROJECT.md.

### 4. Literature Endpoint `/api/literature`
We will implement `/api/literature?query=...` returning aggregated results from PubMed, bioRxiv, and OpenAlex.
Expected schema:
```json
{
  "query": "string",
  "pubmed": [
    {
      "pmid": "string",
      "title": "string",
      "authors": "string",
      "journal": "string",
      "pub_date": "string",
      "abstract": "string",
      "doi": "string"
    }
  ],
  "biorxiv": [
    {
      "doi": "string",
      "title": "string",
      "authors": "string",
      "pub_date": "string",
      "abstract": "string"
    }
  ],
  "openalex": [
    {
      "id": "string",
      "title": "string",
      "authors": "string",
      "pub_date": "string",
      "abstract": "string",
      "doi": "string"
    }
  ]
}
```

## Code Layout
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/api/` (genes.py, variants.py, diseases.py, literature.py)
- `backend/app/services/` (ensembl_service.py, uniprot_service.py, opentargets_service.py, clinvar_service.py, gnomad_service.py, gtex_service.py, chembl_service.py, clinicaltrials_service.py, pubmed_service.py)
- `backend/tests/` (test_genes.py, test_variants.py, test_diseases.py, test_literature.py)
