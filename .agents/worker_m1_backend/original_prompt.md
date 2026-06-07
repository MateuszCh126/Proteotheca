## 2026-06-06T21:57:16Z
You are the Worker for Milestone 1 Backend.
Your working directory is: c:/Users/gamin/Desktop/github/med/.agents/worker_m1_backend/
Your task is to implement the FastAPI backend service logic, API endpoints, and pytest suite.

### Requirements:
1. **Implementation Files**:
   - `backend/app/main.py` - Setup FastAPI app, CORS, lifespan HTTPX client, and endpoints.
   - `backend/app/config.py` - Configuration settings with Pydantic BaseSettings, support `MOCK_MODE` env variable (boolean, default True for testing/offline support, False for real queries).
   - `backend/app/api/`:
     - `genes.py` -> `/api/genes/{symbol}`
     - `variants.py` -> `/api/variants/{variant_id}`
     - `diseases.py` -> `/api/diseases/{disease_name}`
     - `literature.py` -> `/api/literature?query=...`
   - `backend/app/services/`:
     - `ensembl_service.py`, `uniprot_service.py`, `opentargets_service.py`
     - `clinvar_service.py`, `gnomad_service.py`, `gtex_service.py`
     - `chembl_service.py`, `clinicaltrials_service.py`
     - `pubmed_service.py`, `openalex_service.py`, `biorxiv_service.py`
   - `backend/requirements.txt` - Include fastapi, uvicorn, pydantic, pydantic-settings, httpx, pytest, pytest-asyncio, tenacity, etc.
   - `backend/run.py` - Run uvicorn server.
   
2. **Implementation Details**:
   - Conforms to all schemas and interface contracts defined in `PROJECT.md` and `SCOPE.md`.
   - Implement real API query logic using `httpx` in each service client (e.g. hitting Ensembl REST, UniProt search, OpenTargets GraphQL, NCBI E-utilities, etc.).
   - Implement `MOCK_MODE` fallback in services: if `MOCK_MODE=True`, return high-fidelity mock data mimicking real API structures.
   - Handle coordinates liftover (GRCh37 to GRCh38) via Ensembl Liftover API.
   - Parse Variant inputs (rsIDs vs chromosomal coordinates) using regexes, and resolve to coordinates using dbSNP/ClinVar if rsID is provided (Stage 1), then query gnomAD/GTEx/ClinVar concurrently (Stage 2).
   - Resolve literature using PubMed + OpenAlex, scan DOIs for bioRxiv DOIs, and fetch bioRxiv preprints concurrently.
   - Reconstruct OpenAlex abstracts from the `abstract_inverted_index`.
   - Implement tenacity retries and asyncio.Semaphore for rate limiting.
   - Use `asyncio.gather(..., return_exceptions=True)` to execute queries in parallel, handling failures gracefully (returning partial responses).

3. **Verification**:
   - Write unit and integration tests under `backend/tests/` (test_genes.py, test_variants.py, test_diseases.py, test_literature.py) verifying response schemas and endpoint routing.
   - Run the tests with `pytest` using `run_command` in `backend/` directory and verify they all pass.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When done, write handoff.md in your working directory containing test execution command and output, and notify the parent.
