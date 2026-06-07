# BRIEFING — 2026-06-06T21:58:00+02:00

## Mission
Implement the FastAPI backend service logic, API endpoints, and pytest suite for Milestone 1.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: c:/Users/gamin/Desktop/github/med/.agents/worker_m1_backend/
- Original parent: 367e0f55-bcd6-4eda-9c7a-350fe953ea03
- Milestone: Milestone 1 - Backend DB Services & APIs

## 🔒 Key Constraints
- Conforms to all schemas and interface contracts defined in `PROJECT.md` and `SCOPE.md`.
- Implement real API query logic using `httpx` in each service client.
- Implement `MOCK_MODE` fallback in services.
- Handle coordinates liftover (GRCh37 to GRCh38) via Ensembl Liftover API.
- Parse Variant inputs (rsIDs vs chromosomal coordinates) using regexes, and resolve to coordinates using dbSNP/ClinVar if rsID is provided (Stage 1), then query gnomAD/GTEx/ClinVar concurrently (Stage 2).
- Resolve literature using PubMed + OpenAlex, scan DOIs for bioRxiv DOIs, and fetch bioRxiv preprints concurrently.
- Reconstruct OpenAlex abstracts from the `abstract_inverted_index`.
- Implement tenacity retries and asyncio.Semaphore for rate limiting.
- Use `asyncio.gather(..., return_exceptions=True)` to execute queries in parallel, handling failures gracefully (returning partial responses).
- Write pytest unit and integration tests and make sure they pass.
- NO CHEATING. All implementations must be genuine.

## Current Parent
- Conversation ID: 367e0f55-bcd6-4eda-9c7a-350fe953ea03
- Updated: 2026-06-06T21:58:00+02:00

## Task Summary
- **What to build**: FastAPI backend with CORS, httpx lifespan client, endpoints (`/api/genes/{symbol}`, `/api/variants/{variant_id}`, `/api/diseases/{disease_name}`, `/api/literature`), and backend services with real/mock capabilities.
- **Success criteria**: All endpoints return correct schemas, real API calls execute (when MOCK_MODE=False), mock API calls execute (when MOCK_MODE=True), coordinates liftover works, variant parsing/resolving works, literature query and abstract reconstruction work, tenacity retries and rate limiting are active, and the entire test suite passes.
- **Interface contracts**: `PROJECT.md` and `SCOPE.md`.
- **Code layout**: `backend/app/...` and `backend/tests/...`.

## Change Tracker
- **Files modified**: None
- **Build status**: TBD
- **Pending issues**: None

## Quality Status
- **Build/test result**: TBD
- **Lint status**: TBD
- **Tests added/modified**: None

## Loaded Skills
None

## Key Decisions Made
- None yet.

## Artifact Index
- None yet.
