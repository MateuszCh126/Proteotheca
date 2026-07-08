# Original User Request

## Initial Request — 2026-06-06T19:53:31Z

A high-fidelity, interactive research portal (BioMed Explorer) for med-tech developers, clinicians, and bio-engineers to analyze target genes, clinical variants, and potential drug interactions by integrating multiple biological databases and literature.

Working directory: c:/Users/gamin/Desktop/github/med
Integrity mode: development

## Requirements

### R1. Multi-Entity Search & Data Aggregation
The backend must support searching by:
1. **Gene Symbol** (e.g., *BRAF*, *EGFR*, *TP53*): Aggregate details from Ensembl (CDS/transcripts), UniProt, and OpenTargets (target associations).
2. **Genetic Variant** (e.g., rsID like *rs113488022*, or chromosomal coordinates): Retrieve ClinVar pathogenicity, gnomAD allele frequencies, and GTEx tissue expression impacts (eQTLs).
3. **Disease/Indication** (e.g., *Melanoma*, *Breast Cancer*): Retrieve associated genes (OpenTargets), active chemical compounds/drugs (ChEMBL), and clinical trials (ClinicalTrials.gov).

### R2. Interactive 3D Protein Structure Viewer
The frontend must feature an embedded interactive WebGL molecular viewer (e.g., Mol* or 3Dmol.js). When a gene or PDB ID is searched, the viewer must load and display the 3D structure (from PDB or AlphaFold DB). The viewer must support highlighting mutation coordinates or specific domains (e.g., coloring by pLDDT or ligand binding sites).

### R3. High-Resolution PyMOL Rendering Engine
For detailed, publication-ready visualization, the backend must integrate PyMOL. If the user requests a detailed rendering (e.g., by clicking "Generate Detailed Render" after customizing representations like cartoon/spheres/surface/colors), the backend must spin up PyMOL to render the 3D structure and output a high-resolution downloadable PNG.

### R4. Premium Scientific UI/UX
The user interface must be a highly polished dashboard (React/Vite with TypeScript + FastAPI/Python backend) using a dark/glassmorphic aesthetic, custom HSL color palettes, and Google Fonts (e.g., Inter/Outfit). The dashboard should use tabs/panels:
* **Search Panel**: Smart search with autocompletion/entity detection.
* **Target & Pathway Panel**: Gene info, Reactome pathways, and STRING interaction network (visualized as a graph).
* **Variant Impact Panel**: ClinVar pathogenicity, gnomAD frequency charts, and GTEx expression heatmap.
* **Therapeutic Panel**: Associated drugs (ChEMBL), active clinical trials (ClinicalTrials.gov), and adverse drug events (openFDA).
* **Literature Panel**: Recent publications from PubMed/bioRxiv/OpenAlex with abstract summaries.

## Acceptance Criteria

### Backend & API Reliability
- [ ] FastAPI backend serves JSON endpoints for resolving Genes, Variants, Diseases, and Literature.
- [ ] PyMOL rendering endpoint generates a valid high-resolution PNG on demand based on requested PDB/AlphaFold coordinates and coloring instructions.
- [ ] Backend includes a comprehensive test suite (`pytest`) verifying that mock queries for each entity type (Gene, Variant, Disease) return valid, expected JSON schemas.

### Interactive Frontend & Visuals
- [ ] React dashboard implements a sleek, responsive dark theme with CSS transitions and HSL color styling.
- [ ] Mol* (or similar WebGL library) successfully renders PDB structures in-browser, with controls to rotate/zoom and highlight specific residues.
- [ ] Population allele frequency data from gnomAD is visualized using responsive charts (e.g., bar charts or gauges).
- [ ] STRING protein interaction network is visualized as an interactive node graph.

### Developer & Doctor UX
- [ ] The app launches locally via a single command (or concurrent frontend/backend startup script) and can be accessed in the browser.
- [ ] Interface features clear tooltips, unit indicators (e.g., IC50 values, p-values, allele frequencies), and links to source database entries.

## Follow-up — 2026-06-10T21:26:09+02:00

We are resuming the BioMed Explorer project. The workspace has been moved to D:/github/github/med. 

The previous run successfully initialized the project and populated:
- Backend: FastAPI server in 'backend/app' with passing pytest unit tests for authentication, genes, projects, and variants.
- Frontend: React Vite TypeScript Tailwind SPA in 'frontend'.

Please read the existing code in 'D:/github/github/med' (especially ORIGINAL_REQUEST.md, PROJECT.md, and TEST_INFRA.md) and CONTINUE implementing the project from where it was interrupted.

Specifically, you need to complete:
1. Milestone 2: PyMOL Rendering Service (/api/pymol/render endpoint and backend service integration).
2. Milestone 4: Interactive Mol* WebGL viewer (MolViewer.tsx) and STRING node graph (StringNetwork.tsx) on the frontend.
3. Milestone 5 & 6: E2E Integration, automated tests, and coverage hardening.

Working directory: D:/github/github/med
Integrity mode: development

Requirements:
### R1. Multi-Entity Search & Data Aggregation
The backend must support searching by:
1. **Gene Symbol** (e.g., BRAF, EGFR, TP53): Aggregate details from Ensembl (CDS/transcripts), UniProt, and OpenTargets (target associations).
2. **Genetic Variant** (e.g., rsID like rs113488022, or chromosomal coordinates): Retrieve ClinVar pathogenicity, gnomAD allele frequencies, and GTEx tissue expression impacts (eQTLs).
3. **Disease/Indication** (e.g., Melanoma, Breast Cancer): Retrieve associated genes (OpenTargets), active chemical compounds/drugs (ChEMBL), and clinical trials (ClinicalTrials.gov).

### R2. Interactive 3D Protein Structure Viewer
The frontend must feature an embedded interactive WebGL molecular viewer (e.g., Mol* or 3Dmol.js). When a gene or PDB ID is searched, the viewer must load and display the 3D structure (from PDB or AlphaFold DB). The viewer must support highlighting mutation coordinates or specific domains (e.g., coloring by pLDDT or ligand binding sites).

### R3. High-Resolution PyMOL Rendering Engine
For detailed, publication-ready visualization, the backend must integrate PyMOL. If the user requests a detailed rendering (e.g., by clicking "Generate Detailed Render" after customizing representations like cartoon/spheres/surface/colors), the backend must spin up PyMOL to render the 3D structure and output a high-resolution downloadable PNG.

### R4. Premium Scientific UI/UX
The user interface must be a highly polished dashboard (React/Vite with TypeScript + FastAPI/Python backend) using a dark/glassmorphic aesthetic, custom HSL color palettes, and Google Fonts (e.g., Inter/Outfit). The dashboard should use tabs/panels:
* Search Panel: Smart search with autocompletion/entity detection.
* Target & Pathway Panel: Gene info, Reactome pathways, and STRING interaction network (visualized as a graph).
* Variant Impact Panel: ClinVar pathogenicity, gnomAD frequency charts, and GTEx expression heatmap.
* Therapeutic Panel: Associated drugs (ChEMBL), active clinical trials (ClinicalTrials.gov), and adverse drug events (openFDA).
* Literature Panel: Recent publications from PubMed/bioRxiv/OpenAlex with abstract summaries.

Acceptance Criteria:
- FastAPI backend serves JSON endpoints for resolving Genes, Variants, Diseases, and Literature.
- PyMOL rendering endpoint generates a valid high-resolution PNG on demand based on requested PDB/AlphaFold coordinates and coloring instructions.
- Backend includes a comprehensive test suite (pytest) verifying that mock queries for each entity type (Gene, Variant, Disease) return valid, expected JSON schemas.
- React dashboard implements a sleek, responsive dark theme with CSS transitions and HSL color styling.
- Mol* (or similar WebGL library) successfully renders PDB structures in-browser, with controls to rotate/zoom and highlight specific residues.
- Population allele frequency data from gnomAD is visualized using responsive charts.
- STRING protein interaction network is visualized as an interactive node graph.
- The app launches locally via a single command or concurrent startup script and can be accessed in the browser.
- Interface features clear tooltips, unit indicators, and links to source database entries.

## Follow-up — 2026-06-10T19:30:24Z

IMPORTANT: The user has clarified that ALL the following 30 scientific tools/databases must be integrated and used within the BioMed Explorer (Proteotheca) application. Please adjust your development plans (PROJECT.md) and implement services, API endpoints, and React dashboard components/tabs for them:

1. AlphaFold DB (structure fetching and analyzing)
2. AlphaGenome (single variant analysis)
3. ChEMBL (bioactive compounds and drug discovery)
4. ClinicalTrials.gov (clinical trials mapping)
5. ClinVar (pathogenicity classifications)
6. dbSNP (resolving rsIDs and genomic variants)
7. EMBL-EBI OLS (Ontology Lookup Service)
8. ENCODE cCREs Registry (cis-Regulatory Elements)
9. Ensembl (gene structure, transcripts, sequences)
10. Foldseek (3D structural similarity search)
11. gnomAD (population allele frequency)
12. GTEx (tissue expression & eQTL mapping)
13. Human Protein Atlas (protein expression & tissue localization)
14. InterPro (domain architecture and family annotation)
15. JASPAR (transcription factor binding profiles)
16. Literature Search (arXiv, bioRxiv/medRxiv, EuropePMC, OpenAlex, PubMed)
17. NCBI Sequence Fetch (fetching protein/nucleotide sequences)
18. openFDA (adverse events, drug labels)
19. OpenTargets (target-disease associations)
20. PDB (protein structure search and metadata)
21. Clustal Omega (multiple sequence alignment - MSA)
22. BLAST/MMseqs2 (sequence similarity search)
23. PubChem (chemical compounds and properties)
24. PyMOL (high-resolution static 3D rendering)
25. QuickGO (gene ontology mappings)
26. Reactome (pathway analysis and pathways hierarchy)
27. STRING (protein-protein interaction network)
28. UCSC Conservation & TFBS (evolutionary conservation, phyloP, TFBS)
29. UniBind (experimentally validated TF binding sites)
30. UniProtKB (protein metadata and function)

Please read the existing code in D:/github/github/med, expand the FastAPI endpoints, create python services for the new databases, and update the React frontend (adding tabs or panels to display this additional data clearly). Make sure all these tools are integrated and tested.


