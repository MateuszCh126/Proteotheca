# E2E Test Runner & Mocks Investigation Report (Handoff)

## 1. Observation

1. **Workspace Structure**:
   - The workspace root `c:\Users\gamin\Desktop\github\med\` is currently in its initial planning state. A listing of the root directory confirms no source code has been implemented yet:
     ```json
     {"name":".agents", "isDir":true}
     {"name":"ORIGINAL_REQUEST.md", "sizeBytes":"3909"}
     {"name":"PROJECT.md", "sizeBytes":"5788"}
     {"name":"TEST_INFRA.md", "sizeBytes":"2181"}
     ```
   - No `backend/`, `frontend/`, or `tests_e2e/` directories exist in the project root yet.

2. **Project Specification Contracts**:
   - `PROJECT.md` details the architectural layout, frontend requirements (React/Vite/TS), and backend specifications (FastAPI). It outlines four backend endpoints:
     - `/api/genes/{symbol}` (integrating Ensembl, UniProt, and OpenTargets)
     - `/api/variants/{variant_id}` (integrating ClinVar, gnomAD, and GTEx)
     - `/api/diseases/{disease_name}` (integrating OpenTargets, ChEMBL, and ClinicalTrials)
     - `/api/pymol/render` (integrating PyMOL 3D rendering)
   - `.agents/sub_orch_m1_backend/SCOPE.md` details a fifth backend endpoint:
     - `/api/literature?query=...` (aggregating PubMed, bioRxiv, and OpenAlex)

3. **E2E Testing Requirements**:
   - `TEST_INFRA.md` dictates that E2E tests must be **opaque-box** and reside in `tests_e2e/` at the root of the project.
   - The E2E test suite must cover 4 tiers with a minimum of **71 test cases**:
     - **Tier 1 (Feature Coverage)**: $\ge 5$ test cases per feature (Total: 30)
     - **Tier 2 (Boundary & Corner Cases)**: $\ge 5$ test cases per feature (Total: 30)
     - **Tier 3 (Cross-feature Combinations)**: Pairwise coverage of major feature interactions (Total: $\ge 6$)
     - **Tier 4 (Real-World Application Scenarios)**: $\ge 5$ multi-stage scenarios (Total: 5)
   - Test features to exercise: Gene Symbol Search, Genetic Variant Search, Disease/Indication Search, Interactive Mol* Viewer, PyMOL Rendering Engine, and Premium Scientific UI.

4. **Environment Environment & Permissions**:
   - Attempting to check system tool versions via `run_command` timed out due to user permission delays on Windows. Thus, the system tool check relies on design synthesis and default runtime expectations for the development environment.

---

## 2. Logic Chain

1. **Runtime Prerequisites**:
   - The frontend is designed as a React / Vite / TypeScript application, which requires a Node.js runtime environment (npm/npx) to develop and build.
   - The backend is designed as a FastAPI application, which requires a Python (pip) runtime environment.
   - Therefore, both Node.js and Python environments are guaranteed to be present and available in the development setup.

2. **Playwright Integration Suitability**:
   - **Node.js/Playwright**:
     - Uses the official Microsoft `@playwright/test` runner, which is the native, first-class implementation of Playwright.
     - Includes robust parallel worker execution (crucial for executing $71+$ test cases in a reasonable time).
     - Features built-in HTML reporting and the **Trace Viewer** (`npx playwright show-trace`), which is essential for capturing and debugging failures in complex UI elements like WebGL canvases (Mol* viewer) and interactive graphs (STRING network).
     - Can intercept browser-level network requests natively using `page.route` to mock external API responses.
     - Supports the `webServer` configuration property to spin up the local development servers (FastAPI backend and React Vite frontend) before test execution and tear them down automatically afterward.
     - Supports E2E API testing natively via `playwright.request`, allowing API contract validation and frontend UI testing to be run together under a single TypeScript-based configuration.
   - **Python/Playwright**:
     - Runs as a wrapper (`pytest-playwright`) that spawns a Node.js process under the hood.
     - Lacks a native configuration file to manage multi-browser project test parameters cleanly.
     - Is less integrated with frontend-oriented tools, making it harder to coordinate frontend/backend concurrent startups in a single command.
     - Requires managing virtual environments (`.venv`) on Windows, which can lead to script activation policy issues (`Restricted` execution policy) in PowerShell.

3. **Recommendation**:
   - **Node.js/Playwright is highly recommended** as the primary E2E test runner for both the frontend UI and backend API E2E checks. It provides a unified, high-performance, and standard runner suite.

4. **Mocking Strategy**:
   - Since external biological databases (NCBI PubMed, bioRxiv, Ensembl, UniProt, gnomAD) have strict rate limits (e.g., PubMed is capped at 3 requests/sec without an API key) and are prone to network timeouts, E2E tests cannot query them directly.
   - To achieve reliable and repeatable opaque-box testing, we will create a lightweight **Mock API Server** inside the `tests_e2e/` folder using Node.js (e.g. Express or Fastify).
   - This mock server will serve static mock JSON payloads conforming to `PROJECT.md` and `sub_orch_m1_backend/SCOPE.md` contracts.
   - During E2E test runs, the mock server will run on port 8000 (the backend port). This allows the frontend to interact with it as if it were the real FastAPI backend, and allows Playwright API tests to hit it directly to verify route compatibility.

---

## 3. Caveats

- **Assumed Runtimes**: We assume that Node.js ($\ge 18$) and Python ($\ge 3.9$) are pre-installed in the developer's environment.
- **PyMOL Rendering Isolation**: PyMOL is a desktop application that requires local C++ binary components. The E2E tests will mock the PyMOL endpoint (`/api/pymol/render`) to return a static mock PNG image rather than attempting to launch PyMOL headlessly during tests, which would make the test suite fragile.
- **Rate Limits & API Keys**: Production deployments will require configuring `.env` variables for real biological APIs (e.g., `NCBI_API_KEY`). The E2E mock server bypasses this necessity during testing.

---

## 4. Conclusion

Node.js/Playwright is selected as the optimal test runner. We define the following structure for `tests_e2e/` to house the configuration, mock server, mock data, and test files:

### Directory & File Structure Plan

```
tests_e2e/
├── package.json                    # E2E dependencies (@playwright/test, express, typescript)
├── playwright.config.ts            # Playwright E2E configuration (webServer, projects, etc.)
├── tsconfig.json                   # TS compiler settings for testing
├── mock-server.ts                  # Express-based mock server mimicking FastAPI endpoints
├── mocks/                          # JSON data structures matching API contracts
│   ├── data/
│   │   ├── genes/
│   │   │   ├── braf.json           # Mock response for /api/genes/BRAF
│   │   │   ├── egfr.json           # Mock response for /api/genes/EGFR
│   │   │   ├── tp53.json           # Mock response for /api/genes/TP53
│   │   │   └── invalid_gene.json   # Mock response for invalid gene search
│   │   ├── variants/
│   │   │   ├── rs113488022.json    # Mock response for rs113488022
│   │   │   └── invalid_variant.json
│   │   ├── diseases/
│   │   │   ├── melanoma.json       # Mock response for Melanoma
│   │   │   ├── breast_cancer.json  # Mock response for Breast Cancer
│   │   │   └── invalid_disease.json
│   │   ├── literature/
│   │   │   ├── melanoma_lit.json   # Mock response for literature query=Melanoma
│   │   │   └── empty_lit.json      # Mock response for query returning nothing
│   │   └── pymol/
│   │       ├── mock_structure.pdb  # Mock PDB coordinate data
│   │       └── mock_render.png     # Mock rendered PNG image file
└── tests/                          # 71+ Playwright Test Cases
    ├── utils/
    │   └── helpers.ts              # Shared helpers, page objects, and schema validators
    ├── tier1_feature/              # Tier 1: Feature Coverage (30 tests)
    │   ├── gene_search.spec.ts     # 5 tests (R1.1)
    │   ├── variant_search.spec.ts  # 5 tests (R1.2)
    │   ├── disease_search.spec.ts  # 5 tests (R1.3)
    │   ├── molstar_viewer.spec.ts  # 5 tests (R2)
    │   ├── pymol_renderer.spec.ts  # 5 tests (R3)
    │   └── premium_ui.spec.ts      # 5 tests (R4)
    ├── tier2_boundary/             # Tier 2: Boundary & Corner Cases (30 tests)
    │   ├── gene_search_boundary.spec.ts    # 5 tests
    │   ├── variant_search_boundary.spec.ts # 5 tests
    │   ├── disease_search_boundary.spec.ts # 5 tests
    │   ├── molstar_viewer_boundary.spec.ts # 5 tests
    │   ├── pymol_renderer_boundary.spec.ts # 5 tests
    │   └── premium_ui_boundary.spec.ts     # 5 tests
    ├── tier3_cross_feature/        # Tier 3: Pairwise Combinations (>=6 tests)
    │   └── cross_feature.spec.ts   # Pairwise feature matrix verification tests
    └── tier4_real_world/           # Tier 4: Real-World Application Scenarios (5 tests)
        └── scenarios.spec.ts       # Complex scenarios (e.g., Melanoma discovery)
```

---

## 5. Verification Method

To independently verify the suitability and proposed configuration:
1. **Directory Verification**: Once implemented by the worker agent, verify that the `tests_e2e/` folder contains the planned layout and files using `list_dir` or `find_by_name`.
2. **Configuration Syntax Check**: Run `npx playwright test --dry-run` from the `tests_e2e/` folder to verify that Playwright parses `playwright.config.ts` without errors.
3. **Mock Server Liveness Check**: Start the mock server with `npm run mock-server` and query `http://localhost:8000/api/genes/BRAF` via curl or postman to check if the mocked responses align with `PROJECT.md` specifications.
4. **Validation Command**: Test execution can be verified by running `npx playwright test` which runs all 71+ test cases in parallel and prints the test results report.
