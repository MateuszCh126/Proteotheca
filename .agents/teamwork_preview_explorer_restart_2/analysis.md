# BioMed Explorer Frontend-Backend & E2E Investigation Report

## Executive Summary
This report summarizes the findings from a read-only investigation of the BioMed Explorer codebase, focusing on Playwright End-to-End (E2E) test failures, frontend-backend API integration state, and backend mock handler fidelity. 

The investigation has revealed two primary root causes for E2E failures:
1. **A test ID mismatch** in `dashboard.spec.ts` line 169: the test expects `[data-testid="publication-card"]` but the component renders `data-testid="literature-card"`.
2. **Missing mock disease data** in Playwright mocks and backend mock services: the E2E test searches for `"Lung Cancer"`, which exists in the frontend's local mock file (`mockData.ts`) but is completely missing from the E2E mock file (`diseases.json`) and the FastAPI backend service mocks (`melanoma` and `breast cancer` are the only supported mock diseases).

Detailed findings, code diff proposals, integration pathways, and verify-by-command instructions are outlined below.

---

## 1. Playwright E2E Test Failures Investigation

### A. Literature Card Test ID Mismatch
* **Location**: `tests_e2e/tests/dashboard.spec.ts:169` vs `frontend/src/components/LiteraturePanel/PublicationCard.tsx`
* **Observation**:
  - The E2E test asserts:
    ```typescript
    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();
    ```
  - The component `PublicationCard.tsx` renders:
    ```tsx
    <div
      className="glass-panel p-4 flex flex-col space-y-3 relative group overflow-hidden border border-white/5 hover:border-cyan-500/20 transition-all duration-300"
      data-testid="literature-card"
    >
    ```
  - Because `publication-card` is not rendered anywhere, the selector fails to resolve, causing the E2E test suite to fail.

### B. "Lung Cancer" Search Failure
* **Location**: `tests_e2e/tests/dashboard.spec.ts:47`
* **Observation**:
  - The E2E test attempts to search for `"Lung Cancer"`:
    ```typescript
    await searchInput.fill('Lung Cancer');
    await searchButton.click();
    await expect(therapeuticPanel.locator('h2')).toContainText('Lung Cancer');
    ```
  - During E2E test execution, the Playwright request intercept mock (`tests_e2e/mocks/index.ts`) intercept `/api/diseases/*` and loads keys from `tests_e2e/mocks/data/diseases.json`.
  - However, `diseases.json` only contains keys for `"Melanoma"` and `"Breast Cancer"`. It does not contain `"Lung Cancer"`.
  - Similarly, the FastAPI backend `opentargets_service.py` and `chembl_service.py` mock modes only define mock datasets for `"melanoma"` and `"breast cancer"`.
  - The search fails, returning a `404 Not Found` response to the frontend, which shows an error banner instead of rendering the `TherapeuticPanel` content, leading to a test timeout/assertion failure.

### C. Mismatched Test IDs Verification across Other Panels
All other panels and elements referenced in E2E tests have been systematically cross-referenced against their corresponding React component implementations. No other mismatched test IDs were found:
* **GenePanel**: Tab triggers (`tab-trigger-gene-transcripts`, `tab-trigger-gene-uniprot`, etc.) and data rows (`opentargets-association-row`) are fully aligned.
* **VariantPanel**: Tab triggers (`tab-trigger-variant-clinvar`, `tab-trigger-variant-gnomad`, etc.) and inner elements are fully aligned.
* **TherapeuticPanel**: Tab triggers (`tab-trigger-therapeutic-genes`, `tab-trigger-therapeutic-drugs`, etc.) and data rows (`disease-associated-gene-row`, `chembl-drug-card`) are fully aligned.
* **MolViewer**: Container ID (`mol-viewer-container`), custom actions (`pymol-render-btn`), and camera controls are fully aligned.
* **StringNetwork**: Container ID (`string-network-container`) and SVG nodes/edges elements are fully aligned.
* **AnalysisTools**: Sub-tabs and results elements are fully aligned.

---

## 2. Frontend-Backend Integration State

The current React frontend-backend integration is in a **hybrid** state:
1. **Search Handler (Integrated)**: The central search handler `handleSearch` in `App.tsx` is already integrated with the backend endpoints using the utility `apiJson` from `src/api/client.ts`. It correctly queries `/api/genes/*`, `/api/variants/*`, `/api/diseases/*`, and `/api/literature?query=*`.
2. **Initial Mount (Mocked)**: On initial load, `App.tsx` populates the default session state (e.g. `BRAF`, `rs113488022`, `Melanoma`) using imported local mock data objects from `frontend/src/api/mockData.ts` instead of hitting the REST endpoints:
   ```typescript
   useEffect(() => {
     setLoadedGene(mockGenes.BRAF);
     setLoadedVariant(mockVariants.rs113488022);
     setLoadedDisease(mockDiseases.Melanoma);
     setLoadedLiterature(mockLiterature.BRAF);
   }, []);
   ```
3. **Isolated Panels (Client-Side Simulated)**:
   - **AnalysisTools**: Performs multiple sequence alignments (BLAST, MSA, Foldseek) entirely in client-side code via a simulated `setInterval` progress bar and hardcoded static hit arrays (`blastHits`, `msaSequences`, `foldseekHits`). It does not query `/api/analysis/*` backend routes.
   - **StringNetwork**: Renders a force-directed network graph using client-side simulated physics nodes and hardcoded mock interaction edges, without requesting STRING database mappings from `/api/genes/{symbol}`'s `string` payload (which is retrieved in the backend via the `string_service.py` but ignored or not requested by the frontend graph).

---

## 3. Mock Handlers Verification & FastAPI Route Match

The Playwright mock handlers in `tests_e2e/mocks/index.ts` intercept HTTP requests to `/api/*` and return JSON payloads from local mock database files.

### A. Comparison of Mock Handlers and FastAPI Backend Routes
| Backend API Endpoint (FastAPI) | Playwright Mock Intercept (E2E) | Status / Action |
| --- | --- | --- |
| `GET /api/genes/{symbol}` | `**/api/genes/*` | Matches. Serves data from `genes.json`. |
| `GET /api/variants/{variant_id}` | `**/api/variants/*` | Matches. Serves data from `variants.json`. |
| `GET /api/diseases/{disease_name}` | `**/api/diseases/*` | Matches. Case-insensitive key lookup. Serves from `diseases.json`. |
| `GET /api/literature?query={query}` | `**/api/literature*` | Matches. Parses query parameters or path. Serves from `literature.json`. |
| `POST /api/pymol/render` | `**/api/pymol/render` | Matches. Resolves with a local PNG binary buffer. |
| `POST /api/analysis/structures/foldseek` | *None* | Missing. Unused by the UI (simulated). |
| `POST /api/analysis/sequence/align` | *None* | Missing. Unused by the UI (simulated). |
| `POST /api/analysis/sequence/similarity` | *None* | Missing. Unused by the UI (simulated). |
| `GET /api/analysis/compounds/{query}` | *None* | Missing. Unused by the UI (simulated). |
| `GET /api/analysis/tfbs/unibind/{tf_name}` | *None* | Missing. Unused by the UI (simulated). |
| `GET /api/projects` (and POST/DELETE) | *None* | Missing. Unused by current E2E test specs, but necessary for project specs. |
| `POST /api/auth/login` (and Register/Logout) | *None* | Missing. Unused by current E2E test specs, but necessary for auth specs. |

### B. Recommendations for Mock Handlers
1. **Align Disease Data**: Add `"Lung Cancer"` to `tests_e2e/mocks/data/diseases.json` to support the E2E search test, or modify the test to use `"Breast Cancer"`.
2. **Add Auth & Projects Mocks**: If E2E testing is expanded to cover user authentication and project state saving, add mocks intercepting `**/api/auth/*` and `**/api/projects*`.

---

## 4. Proposed Fixes & Implementation Plans

As this is a read-only investigation, the following proposed fixes are represented as `.patch` files or replacement strategies to be implemented.

### A. E2E Test Fixes (`.patch` file)
This patch corrects the `publication-card` selector mismatch and redirects the disease search test to search for `"Breast Cancer"`, which has mock data.

```patch
diff --git a/tests_e2e/tests/dashboard.spec.ts b/tests_e2e/tests/dashboard.spec.ts
index c6b9c9f..e4dfef3 100644
--- a/tests_e2e/tests/dashboard.spec.ts
+++ b/tests_e2e/tests/dashboard.spec.ts
@@ -46,8 +46,8 @@ test.describe('BioMed Explorer Frontend E2E Tests', () => {
     const genePanel = page.locator('[data-testid="gene-panel"]');
     await expect(genePanel.locator('h2')).toContainText('EGFR');
 
-    // 2. Search for Lung Cancer (Disease)
-    await searchInput.fill('Lung Cancer');
+    // 2. Search for Breast Cancer (Disease)
+    await searchInput.fill('Breast Cancer');
     await searchButton.click();
 
     // Verify TherapeuticPanel updates
-    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
-    await expect(therapeuticPanel.locator('h2')).toContainText('Lung Cancer');
+    const therapeuticPanel = page.locator('[data-testid="therapeutic-panel"]');
+    await expect(therapeuticPanel.locator('h2')).toContainText('Breast Cancer');
   });
 
   test('should toggle and display all 30 database/tool panels correctly', async ({ page }) => {
@@ -166,7 +166,7 @@ test.describe('BioMed Explorer Frontend E2E Tests', () => {
     await expect(litPanel).toContainText('Scientific Literature');
     // PubMed filter
     await litPanel.locator('button:has-text("PubMed")').click();
-    await expect(litPanel.locator('[data-testid="publication-card"]').first()).toBeVisible();
+    await expect(litPanel.locator('[data-testid="literature-card"]').first()).toBeVisible();
   });
 
   test('should execute sequence/structure search in Analysis Tools tab', async ({ page }) => {
```

*Note: Alternatively, `Lung Cancer` data can be appended to `tests_e2e/mocks/data/diseases.json` instead of changing the search term in the test.*

### B. Connecting initial `App.tsx` load to Backend API
To move from local mockup files on startup to utilizing the backend API:

Modify `App.tsx`'s `useEffect` block to perform asynchronous API requests:
```typescript
  // Load default session state from the backend API on mount
  useEffect(() => {
    const loadDefaultState = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const gene = await apiJson<any>('/api/genes/BRAF');
        const variant = await apiJson<any>('/api/variants/rs113488022');
        const disease = await apiJson<any>('/api/diseases/Melanoma');
        const lit = await apiJson<any>('/api/literature?query=BRAF');
        
        setLoadedGene(gene);
        setLoadedVariant(variant);
        setLoadedDisease(disease);
        setLoadedLiterature(lit);
      } catch (err: any) {
        console.warn("Backend unavailable during initial load, falling back to local mocks.", err);
        // Fallback to local mock files
        setLoadedGene(mockGenes.BRAF);
        setLoadedVariant(mockVariants.rs113488022);
        setLoadedDisease(mockDiseases.Melanoma);
        setLoadedLiterature(mockLiterature.BRAF);
      } finally {
        setIsLoading(false);
      }
    };
    loadDefaultState();
  }, []);
```
