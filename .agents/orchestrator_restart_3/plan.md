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

*Status: Completed (MolViewer, StringNetwork, and panel components are fully functional and passing E2E tests).*

### Milestone 5: E2E Integration & Playwright Test Suite
1. **Frontend-Backend Integration**:
   - Replace mock client search logic in `App.tsx` with actual fetches to the backend API.
2. **Playwright E2E Tests**:
   - Implement Playwright test cases in `tests_e2e/tests/` matching all 4 Tiers defined in `TEST_INFRA.md` (minimum 71 test cases).
   - Ensure mocks under `tests_e2e/mocks/` intercept all backend routes correctly.

*Status: Completed (78 E2E test cases passing).*

### Milestone 6: White-Box Coverage Hardening (Tier 5)
1. **Challenger-Led Verification**:
   - Challenger runs coverage tools on backend and frontend.
   - Identifies untested lines and writes additional stress tests.

*Status: In-progress (spawning Challenger/Auditor to perform verification and integrity audit).*

## Subagent Dispatch Plan

- **Step 1**: Review worker handoff.md and verify changes (Done).
- **Step 2**: Spawn a reviewer/critic or auditor to perform Milestone 6 white-box coverage hardening / E2E verification, and a Forensic Auditor to perform integrity audit.
- **Step 3**: Final verification and client reporting.
