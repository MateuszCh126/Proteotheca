## 2026-06-10T19:26:40Z
You are the Project Orchestrator (teamwork_preview_orchestrator). Your role is to orchestrate the implementation of the BioMed Explorer project.
Your working directory is: D:/github/github/med/.agents/orchestrator_restart/
Your identity: Project Orchestrator
Workspace root directory: D:/github/github/med
Original user request file: D:/github/github/med/ORIGINAL_REQUEST.md

Please resume from where the previous run left off:
1. Complete Milestone 2: PyMOL Rendering Service (/api/pymol/render endpoint and backend service integration).
2. Complete Milestone 4: Interactive Mol* WebGL viewer (MolViewer.tsx) and STRING node graph (StringNetwork.tsx) on the frontend.
3. Complete Milestone 5 & 6: E2E Integration, automated tests, and coverage hardening.

Please structure your planning, progress, and context files under your working directory `D:/github/github/med/.agents/orchestrator_restart/`. You must create plan.md, progress.md, and context.md in this directory and keep them updated.
Please begin planning immediately.

## 2026-06-10T19:30:35Z
IMPORTANT UPDATE:
The user has clarified that ALL the following 30 scientific tools/databases must be integrated and used within the BioMed Explorer (Proteotheca) application. Please adjust your development plans (PROJECT.md) and implement services, API endpoints, and React dashboard components/tabs for them:

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
