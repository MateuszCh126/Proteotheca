# E2E Test Runner & Mocks Suitability Analysis (Handoff Report)

## 1. Observation

1. **Workspace Files & Layout**:
   - The workspace root `c:\Users\gamin\Desktop\github\med` is in its initial setup phase. Running a directory check confirms that no `backend/`, `frontend/`, or `tests_e2e/` directories exist yet. The files in the workspace are:
     - `ORIGINAL_REQUEST.md` (3909 bytes)
     - `PROJECT.md` (5788 bytes)
     - `TEST_INFRA.md` (2181 bytes)
   - `PROJECT.md` specifies the E2E directory layout:
     ```
     56: ├── tests_e2e/                   # E2E Test Suite (Opaque-box)
     ```
   - `TEST_INFRA.md` specifies the test architecture and candidates:
     ```
     18: - **Test Runner**: Node.js/Playwright (or Python/Playwright/Selenium) for frontend E2E tests, and Python `requests`/`pytest` for backend API E2E tests.
     19: - **Pass/Fail Semantics**: Zero errors in browser logs, API endpoints return 200 OK with correct schema, frontend elements render successfully.
     20: - **Directory Layout**: `tests_e2e/` at the root of the project.
     ```

2. **System Environment Constraints**:
   - Running command-line probes (e.g. `python --version`, `node --version`) timed out with user response delays on Windows:
     ```
     Encountered error in step execution: Permission prompt for action 'command' on target 'python --version; node --version; npm --version; pip --version' timed out waiting for user response.
     ```
   - System access constraints force the analysis to rely on:
     - Developer environment setup contracts (React requires Node.js/npm; FastAPI requires Python/pip).
     - Peer handoff analyses written by `explorer_m1_2` (`.agents/explorer_m1_2/handoff.md`) and `explorer_m1_3` (`.agents/explorer_m1_3/handoff.md`).
   - The project is running under **CODE_ONLY network restrictions** as documented in the orchestrator context:
     ```
     - **Network Mode**: CODE_ONLY (No external internet or HTTP/HTTPS requests)
     ```
     This prevents `playwright install` from pulling down browser binaries from external CDNs.

3. **Required E2E Test Scopes**:
   - `TEST_INFRA.md` lines 31-36 requires a minimum of **71 test cases** split across 4 tiers:
     - **Tier 1 (Feature Coverage)**: $\ge 5$ test cases per feature (Total: 30)
     - **Tier 2 (Boundary & Corner Cases)**: $\ge 5$ test cases per feature (Total: 30)
     - **Tier 3 (Cross-feature Combinations)**: Pairwise coverage of major feature interactions (Total: $\ge 6$)
     - **Tier 4 (Real-World Application Scenarios)**: $\ge 5$ multi-stage scenarios (Total: 5)
   - Features include: Gene Search (R1.1), Variant Search (R1.2), Disease Search (R1.3), Mol* WebGL Viewer (R2), PyMOL Rendering Engine (R3), and Premium Scientific UI (R4).

---

## 2. Logic Chain

1. **Available Runtimes**:
   - The React frontend (TypeScript + Vite) requires a Node.js installation (npm/npx) to build and run.
   - The FastAPI backend requires a Python installation (pip) to run.
   - Therefore, both Node.js and Python runtimes are guaranteed to be present and available in the environment.

2. **Suitability of Node.js/Playwright vs. Python/Playwright**:
   - **Language Consistency & Maintenance**: The React dashboard uses TypeScript. Implementing the E2E browser tests in TypeScript using `@playwright/test` keeps the frontend stack unified. Python/Playwright would require separate virtual environment setups (`.venv`) and introduce syntax mismatch for frontend-focused tests.
   - **Parallel Execution**: Node.js/Playwright features built-in fully-parallel worker pooling which handles large test suites (71+ test cases) significantly faster than serial or wrapper-based execution.
   - **Visual Comparison**: Node.js/Playwright has native support for visual regression tests (`toHaveScreenshot()`), which is critical for verifying the dark/glassmorphic styling, gnomAD frequency charts, and Mol* WebGL viewer canvas rendering.
   - **Tracing & Diagnostics**: The native Node-based Playwright trace viewer captures screenshot and network event snapshots, allowing debugging of WebGL render failures in a containerized or headless Windows workspace.
   - **CODE_ONLY Isolation Strategy**: Standard Playwright downloads custom browser binaries, which fails in `CODE_ONLY` mode. However, both Node.js/Playwright and Python/Playwright support launching pre-installed system browsers (e.g. Google Chrome or Microsoft Edge) by specifying `channel: 'chrome'` or `channel: 'msedge'` in the configuration.
   - **API vs. UI Testing Split**: `TEST_INFRA.md` requires Node.js/Playwright (or similar) for frontend E2E tests, and Python `requests`/`pytest` for backend API E2E tests. Rather than trying to force API tests into Playwright, a clean co-existence is recommended within `tests_e2e/` where Playwright runs TypeScript frontend UI/UX tests and `pytest` runs Python E2E API tests.

3. **Mocking and Network Interception Strategy**:
   - Due to the `CODE_ONLY` network restriction, we cannot make live queries to biological databases (NCBI PubMed, bioRxiv, Ensembl, UniProt, gnomAD, etc.).
   - Reconciling the peer proposals:
     - `explorer_m1_2` suggests an Express-based mock server on port 8000.
     - `explorer_m1_3` suggests page-level request interception (`page.route()`).
     - **Reconciliation**:
       - For integrated E2E runs, the backend FastAPI server itself will run with a mock configuration flag, using its own mock database services (as specified in Milestone 1: "mockable database aggregation services"). This verifies the actual FastAPI API endpoints.
       - For frontend UI/UX testing in isolation, Playwright's native `page.route` is optimal because it runs directly within the test process without spawning a separate server.
       - For backend API E2E testing, Python's `pytest` will hit the FastAPI server directly.

---

## 3. Caveats

- **System Browser Presence**: Using browser channels (`chrome` or `msedge`) assumes Google Chrome or Microsoft Edge is pre-installed on the host system. If neither is available, Playwright execution will fail.
- **Service-Level Mocks**: Since we do not run live queries, E2E tests are dependent on the fidelity of the mock data payloads. If backend/external database contracts change, mock files in `tests_e2e/mocks/` must be manually kept in sync.
- **PyMOL Headless Renders**: PyMOL rendering generates static PNGs. Headless execution on a build system can be brittle. Therefore, the E2E tests will verify that the rendering endpoint returns a valid PNG payload (which can be mock-generated or pre-rendered).

---

## 4. Conclusion

We select **Node.js/Playwright (TypeScript)** for E2E frontend and UI tests, and **Python/pytest (requests)** for E2E API tests. Both will reside under a single unified `tests_e2e/` directory at the project root, keeping tests isolated by type.

### Proposed Directory Layout

```
tests_e2e/
├── package.json                    # E2E frontend deps (typescript, @playwright/test)
├── playwright.config.ts            # Playwright browser E2E config (uses system chrome/edge)
├── tsconfig.json                   # TS compiler options for tests_e2e
├── README.md                       # Instruction manual for running all E2E tests
├── requirements-e2e.txt            # Python deps for API E2E tests (pytest, requests)
├── pytest.ini                      # Pytest runner configuration
├── run_tests.bat                   # Execution script to run both suites concurrently
├── mocks/                          # Unified E2E mock data and routing helpers
│   ├── data/
│   │   ├── genes.mock.json         # Mock data for BRAF, EGFR, TP53, and invalid queries
│   │   ├── variants.mock.json      # Mock data for rs113488022 and invalid variants
│   │   ├── diseases.mock.json      # Mock data for Melanoma, Breast Cancer
│   │   └── literature.mock.json    # Mock search outcomes for PubMed/bioRxiv
│   ├── assets/
│   │   └── mock_pymol_render.png   # A mock high-resolution image to serve as PyMOL output
│   └── playwright_mocks.ts         # Native page.route interceptors for standalone UI runs
└── suites/                         # Test suites segmented by framework
    ├── frontend/                   # Playwright UI/UX spec tests (71+ test cases total)
    │   ├── tier1_feature/          # Tier 1: Core Feature Verification (30 tests)
    │   │   ├── gene_search.spec.ts
    │   │   ├── variant_search.spec.ts
    │   │   ├── disease_search.spec.ts
    │   │   ├── molstar_viewer.spec.ts
    │   │   ├── pymol_renderer.spec.ts
    │   │   └── premium_ui.spec.ts
    │   ├── tier2_boundary/         # Tier 2: Boundary & Corner Cases (30 tests)
    │   │   ├── gene_boundary.spec.ts
    │   │   ├── variant_boundary.spec.ts
    │   │   ├── disease_boundary.spec.ts
    │   │   ├── molstar_boundary.spec.ts
    │   │   ├── pymol_boundary.spec.ts
    │   │   └── ui_boundary.spec.ts
    │   ├── tier3_cross_feature/    # Tier 3: Pairwise Interaction Tests (>=6 tests)
    │   │   └── cross_feature.spec.ts
    │   └── tier4_real_world/       # Tier 4: Real-World Scenarios (5 tests)
    │       └── scenarios.spec.ts
    └── backend/                    # Python API E2E tests (Tiers 1-3 API validations)
        ├── conftest.py             # Setup hooks, BASE_URL resolution
        ├── test_tier1_api.py       # API path checks & contract confirmations
        ├── test_tier2_api.py       # Bad inputs & query boundary testing
        └── test_tier3_api.py       # Multi-route sequencing verification
```

---

## 5. Verification Method

To independently verify the environment suitability and E2E project structure:
1. **Compilation Check**: Once the structure is generated, verify that TypeScript compiles the configuration and specs by running `npx tsc --noEmit` inside `tests_e2e/`.
2. **Playwright Configuration Verification**: Run `npx playwright test --dry-run` to ensure that Playwright correctly reads `./playwright.config.ts`, resolves the Chrome/Edge channels, and maps the `suites/frontend/` directory.
3. **Pytest Configuration Verification**: Verify that the python test structure is discovered properly by running `pytest --collect-only` from `tests_e2e/` with the python environment active.
4. **Execution Test**: Verify full execution of both suites:
   - Run `npx playwright test` for frontend UI tests.
   - Run `pytest suites/backend/` for backend API tests.
