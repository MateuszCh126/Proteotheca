# E2E Test Infra: BioMed Explorer

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Gene Symbol Search | R1.1 | 5 | 5 | Yes |
| 2 | Genetic Variant Search | R1.2 | 5 | 5 | Yes |
| 3 | Disease/Indication Search | R1.3 | 5 | 5 | Yes |
| 4 | Interactive Mol* Viewer | R2 | 5 | 5 | Yes |
| 5 | PyMOL Rendering Engine | R3 | 5 | 5 | Yes |
| 6 | Premium Scientific UI | R4 | 5 | 5 | Yes |

## Test Architecture
- **Test Runner**: Node.js/Playwright (or Python/Playwright/Selenium) for frontend E2E tests, and Python `requests`/`pytest` for backend API E2E tests.
- **Pass/Fail Semantics**: Zero errors in browser logs, API endpoints return 200 OK with correct schema, frontend elements render successfully.
- **Directory Layout**: `tests_e2e/` at the root of the project.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Melanoma Target Discovery & Drug Repurposing | Disease (Melanoma) -> Gene (BRAF) -> Mol* Viewer -> PyMOL Render -> ChEMBL Drugs | High |
| 2 | Clinician Variant Impact Investigation | Search Variant (rs113488022) -> GTEx Heatmap -> ClinVar Pathogenicity -> Literature Search | High |
| 3 | Novel Bio-engineering Target Check | Search Gene (TP53) -> Reactome Pathways -> STRING Interaction Graph -> Mol* Highlight | High |
| 4 | Breast Cancer Drug Profiling | Disease (Breast Cancer) -> ChEMBL Active Compounds -> ClinicalTrials.gov -> openFDA Adverse Events | High |
| 5 | Literature Evidence Synthesis | Gene (EGFR) -> Literature Panel (PubMed/bioRxiv/OpenAlex) -> Abstract Summaries | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total: 30)
- Tier 2: ≥5 per feature (Total: 30)
- Tier 3: pairwise coverage of major feature interactions (Total: ≥6)
- Tier 4: ≥5 realistic application scenarios (Total: 5)
- **Minimum E2E Test Cases: 71**
