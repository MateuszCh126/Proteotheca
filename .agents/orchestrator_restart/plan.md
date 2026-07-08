# Plan: BioMed Explorer Integration

This plan outlines the steps to complete Milestone 2 (PyMOL Backend & 30 Services), Milestone 4 (Interactive Frontend & 30 Visuals), Milestone 5 (E2E Integration & Playwright Tests), and Milestone 6 (Coverage Hardening) for the BioMed Explorer project.

## Milestone Decompositions

### Milestone 2: PyMOL Rendering & 30 Backend Services
1. **PyMOL Rendering Service**:
   - Implement `backend/app/services/pymol_service.py` with mock mode (returning local PNG) and real mode (subprocess executing PyMOL CLI).
   - Implement endpoint `/api/pymol/render` accepting representation, coloring mode, PDB ID, and residues.
2. **Additional 30 Scientific Services**:
   - Integrate all 30 scientific tools by implementing services under `backend/app/services/` and registering endpoints:
     - **Gene Routes (/api/genes/{symbol})**:
       - AlphaFold DB structure metadata & pLDDT confidence.
       - Human Protein Atlas tissue expression & localization.
       - InterPro domain family annotations.
       - NCBI Sequence Fetch (FASTA protein/nucleotide sequence).
       - QuickGO ontology terms.
       - Reactome pathway hierarchy.
       - STRING network edges.
     - **Variant Routes (/api/variants/{variant_id})**:
       - AlphaGenome regulatory variant analysis.
       - dbSNP rsID resolving.
       - UCSC Conservation (phyloP) & TFBS.
       - UniBind TF binding sites.
       - JASPAR transcription factor binding profiles.
     - **Disease Routes (/api/diseases/{disease_name})**:
       - openFDA drug adverse events.
       - PubChem compound properties.
       - EMBL-EBI OLS disease ontology resolution.
       - ENCODE cCREs cell type regulatory elements.
     - **Literature Routes (/api/literature/search)**:
       - Expand with arXiv and EuropePMC preprints.
     - **Sequence/Structure Tools**:
       - `/api/sequence/similarity` (BLAST/MMseqs2).
       - `/api/sequence/msa` (Clustal Omega).
       - `/api/structure/similarity` (Foldseek).
3. **Unit Tests**:
   - Implement pytest files under `backend/tests/` to verify schemas of all new and existing services.

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

### Milestone 5: E2E Integration & Playwright Test Suite
1. **Frontend-Backend Integration**:
   - Replace mock client search logic in `App.tsx` with actual fetches to the backend API.
2. **Playwright E2E Tests**:
   - Implement Playwright test cases in `tests_e2e/tests/` matching all 4 Tiers defined in `TEST_INFRA.md` (minimum 71 test cases).
   - Ensure mocks under `tests_e2e/mocks/` intercept all backend routes correctly.

### Milestone 6: White-Box Coverage Hardening (Tier 5)
1. **Challenger-Led Verification**:
   - Challenger runs coverage tools on backend and frontend.
   - Identifies untested lines and writes additional stress tests.

## Subagent Dispatch Plan

- **Step 1**: Spawn `teamwork_preview_worker` (`worker_m2_backend`) to implement the Milestone 2 backend services, endpoints, and pytest suite. Include the instruction to update `PROJECT.md` as the first task.
- **Step 2**: Verify Milestone 2 via unit tests (Worker reports tests pass). Run Forensic Auditor to check compliance.
- **Step 3**: Spawn `teamwork_preview_worker` (`worker_m4_frontend`) to implement Mol* viewer, force layout graph, expanded tabs/panels for 30 databases, and analysis tools UI.
- **Step 4**: Verify frontend build and locales.
- **Step 5**: Spawn `teamwork_preview_worker` (`worker_m5_e2e`) to connect frontend/backend, write mock handlers, and implement Playwright test suite (71+ cases).
- **Step 6**: Run complete verification and Forensic Audit.
