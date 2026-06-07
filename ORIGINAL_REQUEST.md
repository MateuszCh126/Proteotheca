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
