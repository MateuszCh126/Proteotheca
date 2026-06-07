# Context - BioMed Explorer Frontend UI

## Tech Stack
- **Framework**: React (Vite, TypeScript)
- **Styling**: Tailwind CSS + Custom glassmorphic styles
- **Icons**: `lucide-react`
- **Charts**: `recharts` for population frequencies & heatmaps

## Component Registry
- `frontend/src/components/SearchBar.tsx`: Search bar with dropdown autocompletion and entity type indicators.
- `frontend/src/components/GenePanel.tsx`: Target & Pathway Panel displaying Ensembl, UniProt, Reactome pathway tables, and a container placeholder for STRING.
- `frontend/src/components/VariantPanel.tsx`: ClinVar annotations, gnomAD allele frequencies (as responsive Recharts Bar/Gauge charts), and GTEx expression heatmaps.
- `frontend/src/components/TherapeuticPanel.tsx`: ChEMBL drug table (compounds, names, IC50 values), ClinicalTrials.gov trials list, and openFDA adverse event charts/tables.
- `frontend/src/components/LiteraturePanel.tsx`: PubMed/bioRxiv/OpenAlex publication cards with title, journal, and abstract summaries.
- `frontend/src/components/MolViewer.tsx`: Mol* container placeholder (to be implemented in M4).
- `frontend/src/components/StringNetwork.tsx`: STRING network node graph placeholder (to be implemented in M4).
- `frontend/src/App.tsx`: Main dashboard entry, integrating SearchBar and the panels in a grid layout with transitions and tabs.
- `frontend/src/index.css`: Styles for dark/glassmorphic backdrop filter, neon borders, and animations.
