## 2026-06-10T19:38:45Z
You are a frontend worker (Frontend Developer) assigned to implement Milestone 4: Interactive Frontend & 30 UI Visuals for the BioMed Explorer project.

Your working directory is: D:/github/github/med/.agents/worker_m4_frontend/
Please coordinate your work and write your handoff report to D:/github/github/med/.agents/worker_m4_frontend/handoff.md.

### MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective:
1. Upgrade `frontend/src/components/MolViewer/MolViewer.tsx` to integrate the real Mol* WebGL viewer (using `"molstar": "^4.4.2"` dependency).
   - Hook it up to initialize the viewer canvas dynamically using a React ref and `useEffect`.
   - Update representation and coloring modes based on the active props (`representation`: cartoon, surface, spheres; `colorMode`: plddt, chain, hydrophobicity).
   - Handle coordinates fetch gracefully (mock-interceptor ready for E2E tests).
2. Upgrade `frontend/src/components/StringNetwork/StringNetwork.tsx` to implement an interactive force-directed node graph inside SVG or HTML Canvas.
   - Create a physics-based simulation (with gravity, link tension, and charge repulsion) that runs on requestAnimationFrame.
   - Support node dragging, tooltips showing STRING interaction scores, and double-clicking a node to trigger a search for that gene.
3. Update and expand existing panels to display data for all 30 scientific tools/databases:
   - **GenePanel** (`frontend/src/components/GenePanel/`): Show Ensembl ID, transcripts table, UniProt accession & sequence, OpenTargets disease associations, AlphaFold structure ID & confidence, Human Protein Atlas expression & localization, InterPro domains, NCBI Sequence fetch (FASTA download/display), QuickGO ontology mappings, and Reactome pathways.
   - **VariantPanel** (`frontend/src/components/VariantPanel/`): Show ClinVar pathogenicity status, gnomAD population frequencies chart, GTEx tissue heatmap, AlphaGenome variant regulatory analysis, dbSNP coordinates, UCSC Conservation phyloP scores, UniBind binding sites, and JASPAR transcription factor binding profiles.
   - **TherapeuticPanel** (`frontend/src/components/TherapeuticPanel/`): Show disease-associated genes, ChEMBL drugs, active ClinicalTrials.gov studies, openFDA adverse drug events, PubChem compound details, EMBL-EBI OLS ontology path, and ENCODE cCREs cell type regulatory elements.
   - **LiteraturePanel** (`frontend/src/components/LiteraturePanel/`): Show articles with titles, authors, abstracts from PubMed, bioRxiv/medRxiv, OpenAlex, arXiv, and EuropePMC.
4. Implement a new **"Analysis Tools"** section/tab in the dashboard UI for sequence/structure tasks:
   - **BLAST / MMseqs2 Similarity Search**: Form to input a protein sequence and fetch homologous matches from `/api/analysis/similarity`.
   - **Clustal Omega MSA**: Form to input multiple FASTA sequences and display the aligned sequences from `/api/analysis/msa`.
   - **Foldseek Structural Similarity**: Interface to search similar structures from `/api/analysis/structure-similarity` (or `/api/analysis/structure/similarity`).
5. Ensure translation strings for Polish (`pl`) and English (`en`) are fully aligned and that the React app builds successfully (`npm run build` passes with no TS/syntax errors).

Please write your handoff report to `handoff.md` and communicate your results back to me using `send_message`.
