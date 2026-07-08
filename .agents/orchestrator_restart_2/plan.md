# Plan: BioMed Explorer Integration

This plan outlines the steps to complete Milestone 2 (PyMOL Backend & 30 Services), Milestone 4 (Interactive Frontend & 30 Visuals), Milestone 5 (E2E Integration & Playwright Tests), and Milestone 6 (Coverage Hardening) for the BioMed Explorer project.

## Milestone Decompositions

### Milestone 2: PyMOL Rendering & 30 Backend Services
1. **PyMOL Rendering Service**:
   - Implement `backend/app/services/pymol_service.py` with mock mode (returning local PNG) and real mode (subprocess executing PyMOL CLI).
   - Implement endpoint `/api/pymol/render` accepting representation, coloring mode, PDB ID, and residues.
2. **Additional 30 Scientific Services**:
   - Integrate all 30 scientific tools by implementing services under `backend/app/services/` and registering endpoints.
3. **Unit Tests**:
   - Implement pytest files under `backend/tests/` to verify schemas of all new and existing services.

*Status: Completed (all 23 backend unit tests pass).*

### Milestone 4: Interactive Frontend & 30 UI Visuals
1. **MolViewer (Mol* Integration)**:
   - Dynamic initialization of Mol* WebGL viewer.
   - Support representations (cartoon, spheres, surface) and colorings (plddt, chain, hydrophobicity).
2. **StringNetwork (Force-Directed Graph)**:
   - Replace static node layouts with force-directed simulation in SVG/Canvas.
   - Interactive tooltips & node dragging.
3. **Expand Existing Panels**:
   - Update `GenePanel`, `VariantPanel`, `TherapeuticPanel`, `LiteraturePanel` to fetch aggregated data from the backend.
   - Add visualization for the remaining 30 databases (e.g. gnomAD frequency chart, GTEx tissue heatmap, Reactome pathways, HPA tissue localization).
4. **Analysis Tools Dashboard Tab**:
   - Implement UI components for BLAST searches, Clustal Omega MSA, and Foldseek structural search.

*Status: In-progress. MolViewer, StringNetwork, and panel components are partially implemented but E2E tests are failing.*

### Milestone 5: E2E Integration & Playwright Test Suite
1. **Frontend-Backend Integration**:
   - Replace mock client search logic in `App.tsx` with actual fetches to the backend API.
2. **Playwright E2E Tests**:
   - Implement Playwright test cases in `tests_e2e/tests/` matching all 4 Tiers defined in `TEST_INFRA.md` (minimum 71 test cases).
   - Ensure mocks under `tests_e2e/mocks/` intercept all backend routes correctly.

*Status: In-progress. Mocks and basic spec exist, but `dashboard.spec.ts` is failing on literature panel elements.*

### Milestone 6: White-Box Coverage Hardening (Tier 5)
1. **Challenger-Led Verification**:
   - Challenger runs coverage tools on backend and frontend.
   - Identifies untested lines and writes additional stress tests.

*Status: Not started.*

## Subagent Dispatch Plan

- **Step 1**: Spawn `teamwork_preview_explorer` to analyze why the E2E tests (specifically `dashboard.spec.ts`) are failing, inspect the current frontend UI implementation, and identify the gap in literature/tab visualizations.
- **Step 2**: Spawn `teamwork_preview_worker` to implement fixes for Milestone 4 (Frontend panels, MolViewer, StringNetwork, etc.) and Milestone 5 (E2E mocks and Playwright assertions).
- **Step 3**: Spawn `teamwork_preview_reviewer` to review the frontend changes, run E2E tests, and check that all 30 tools are fully integrated and functional.
- **Step 4**: Spawn `teamwork_preview_challenger` for Tier 5 white-box coverage hardening.
- **Step 5**: Run complete verification and Forensic Audit.
