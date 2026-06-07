# Scope: BioMed Explorer E2E Testing Track

## Architecture
The E2E test suite will reside in `tests_e2e/` at the project root. It will be opaque-box, meaning it interacts only with the external interfaces of the application:
1. **API Endpoints**: Fast API backend REST JSON endpoints (`/api/genes/*`, `/api/variants/*`, `/api/diseases/*`, `/api/literature/*`, `/api/pymol/*`).
2. **Web UI**: Frontend React UI, testing visual responsiveness, glassmorphic theme styling, controls, autocompletion, Mol* viewer Canvas rendering, STRING interaction node graph, and gnomAD charts.

The test infrastructure will support:
- Running frontend and backend locally or mocking endpoints for independent verification.
- Automating execution using a single runner command.
- Tracking and reporting test coverage according to the 4 tiers specified in `TEST_INFRA.md`.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | M1: Test Runner & Env Setup | Design the E2E test runner, mock data schemas, and test configuration. Create directory structure and harness files. | None | PLANNED | TBD |
| 2 | M2: Backend API E2E Testing | Implement Tier 1 & 2 API tests for Genes, Variants, Diseases, and Literature. Add Tier 3 pairwise API interaction tests. | M1 | PLANNED | TBD |
| 3 | M3: UI/UX & WebGL E2E Testing | Implement Tier 1, 2, and 3 UI/UX tests using Playwright. Verify Mol* rendering canvas, STRING node graphs, gnomAD charts, and responsive UI panels. | M1 | PLANNED | TBD |
| 4 | M4: Real-World Scenarios | Implement Tier 4 multi-stage application flows (e.g., Melanoma drug discovery, Variant impact search, etc.). | M2, M3 | PLANNED | TBD |
| 5 | M5: Final Verification & Delivery | Execute the entire suite (71+ tests), verify passing status, generate summary reports, write `TEST_READY.md` at root. | M1, M2, M3, M4 | PLANNED | TBD |

## Interface Contracts
The E2E test suite will target and verify compliance with the API specs documented in `PROJECT.md`. It will not assume any internal database schemas or specific library details.
- **Gene endpoint**: `/api/genes/{symbol}`
- **Variant endpoint**: `/api/variants/{variant_id}`
- **Disease endpoint**: `/api/diseases/{disease_name}`
- **PyMOL rendering endpoint**: `/api/pymol/render`
