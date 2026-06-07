# Synthesis of Explorer Findings for Milestone 1

## 1. Consensus
- **Framework**: Node.js with Playwright (`@playwright/test`) and TypeScript.
- **Language**: TypeScript (`.spec.ts`), aligning with the React / TypeScript frontend.
- **Network Isolation Compliance**: Since the environment is `CODE_ONLY`, we cannot run `npx playwright install` to download browser binaries. We must use the system-installed Chrome or Edge by configuring `channel: 'chrome'` or `channel: 'msedge'` in Playwright's browser project settings.
- **Mocking Strategy**: Since external biological APIs (PubMed, bioRxiv, Ensembl, UniProt, gnomAD) have rate limits and are unreachable under network constraints, E2E tests must use mock data. Instead of setting up a separate Express server, we can intercept network requests at the browser level natively using Playwright's `page.route()` API. This is clean, robust, and requires no additional background processes.

## 2. Directory Layout & Key Files
We will create the following layout under `tests_e2e/`:
- `tests_e2e/package.json`: Manages dependencies (`@playwright/test`, `typescript`, `@types/node`).
- `tests_e2e/playwright.config.ts`: Configures Playwright to use `channel: 'chrome'` and run tests in parallel.
- `tests_e2e/tsconfig.json`: TypeScript compiler options.
- `tests_e2e/mocks/`:
  - `mocks/index.ts`: Native Playwright request interceptor setup function.
  - `mocks/data/`: JSON fixtures for Genes (BRAF, EGFR, TP53, invalid), Variants (rs113488022, invalid), Diseases (Melanoma, Breast Cancer, invalid), and Literature.
  - `mocks/assets/`: Binary mock PNG for PyMOL rendering.
- `tests_e2e/tests/`: Directory for E2E tests across 4 Tiers.

## 3. Worker Implementation Strategy
The worker will:
1. Create `tests_e2e/` folder structure.
2. Write `package.json`, `tsconfig.json`, and `playwright.config.ts`.
3. Populate mock JSON data under `tests_e2e/mocks/data/` for Genes, Variants, Diseases, and Literature.
4. Put a mock PNG image for PyMOL rendering under `tests_e2e/mocks/assets/mock_pymol_render.png`.
5. Implement the mocking router in `tests_e2e/mocks/index.ts`.
6. Run `npm install` and verify Playwright configuration via a dry-run test execution.
