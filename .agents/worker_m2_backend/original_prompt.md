## 2026-06-10T19:31:35Z

You are a backend worker (Backend Developer) assigned to implement Milestone 2: PyMOL Rendering & 30 Backend Services for the BioMed Explorer project.

Your working directory is: D:/github/github/med/.agents/worker_m2_backend/
Please coordinate your work and write your handoff report to D:/github/github/med/.agents/worker_m2_backend/handoff.md.

### MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective:
1. Update `D:/github/github/med/PROJECT.md` at the project root to document the new architecture, folder layout, 30 services, and API contracts.
2. Implement PyMOL Rendering Service in `backend/app/services/pymol_service.py` and route in `backend/app/api/pymol.py` supporting `/api/pymol/render` (POST request with PDB ID, representation, coloring, and residues returning binary image/png). By default, if PyMOL is not available globally/locally, fall back to returning the pre-saved mock PNG file at `D:/github/github/med/tests_e2e/mocks/assets/mock_pymol_render.png`.
3. Implement python services in `backend/app/services/` for all missing databases among the requested 30:
   - AlphaFold DB (structure fetching and metadata)
   - AlphaGenome (single variant regulation/expression analysis)
   - dbSNP (rsID resolution to coordinates & GRCh38 mapping)
   - EMBL-EBI OLS (Ontology Lookup Service resolving disease/ontology terms)
   - ENCODE cCREs Registry (cis-Regulatory Elements)
   - Foldseek (3D structural similarity search)
   - Human Protein Atlas (protein expression & tissue localization)
   - InterPro (domain architecture and family annotations)
   - JASPAR (transcription factor binding profiles)
   - NCBI Sequence Fetch (fetching protein/nucleotide sequences)
   - BLAST/MMseqs2 (sequence similarity search)
   - Clustal Omega (multiple sequence alignment - MSA)
   - PubChem (chemical compounds properties)
   - QuickGO (gene ontology mappings)
   - Reactome (pathways & hierarchy)
   - STRING (protein-protein interaction network)
   - UCSC Conservation & TFBS (evolutionary conservation, phyloP, TFBS)
   - UniBind (validated TF binding sites)
   - arXiv (literature search)
   - EuropePMC (literature search)
4. Integrate/register these services within the existing or new API routes under `backend/app/api/`:
   - `/api/genes/{symbol}`: Ensembl, UniProtKB, OpenTargets, AlphaFold, HPA, InterPro, NCBI sequence, QuickGO, Reactome, STRING.
   - `/api/variants/{variant_id}`: ClinVar, gnomAD, GTEx, AlphaGenome, dbSNP, UCSC, UniBind, JASPAR.
   - `/api/diseases/{disease_name}`: OpenTargets, ChEMBL, ClinicalTrials.gov, openFDA, PubChem, OLS, ENCODE cCREs.
   - `/api/literature/{query}`: PubMed, bioRxiv/medRxiv, OpenAlex, arXiv, EuropePMC.
   - `/api/sequence/similarity` (POST): BLAST/MMseqs2 sequence similarity.
   - `/api/sequence/msa` (POST): Clustal Omega MSA.
   - `/api/structure/similarity` (POST): Foldseek 3D structure search.
   - `/api/pymol/render` (POST): PyMOL rendering.
5. Create/update pytest files under `backend/tests/` to verify that all these new endpoints and services return valid JSON structures (and valid binary image content for PyMOL rendering) when queried.
6. Run `pytest` on the backend and make sure all tests pass successfully.

Please write your handoff report to `handoff.md` and communicate your results back to me using `send_message`.
