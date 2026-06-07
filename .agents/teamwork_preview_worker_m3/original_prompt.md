## 2026-06-06T21:56:35Z
**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Objective**:
Design, structure, and implement the React frontend layout, panels, styling, search autocomplete, and charts for BioMed Explorer under the `frontend/` directory.

**Inputs**:
Please read and follow the detailed design guidelines, mock data contracts, state flow, and component specs from the three Explorer reports:
1. Setup & Styling Analysis: `c:\Users\gamin\Desktop\github\med\.agents\teamwork_preview_explorer_m3_1\analysis.md`
2. Component & State Flow: `c:\Users\gamin\Desktop\github\med\.agents\teamwork_preview_explorer_m3_2\analysis.md`
3. Visualizations & Layout: `c:\Users\gamin\Desktop\github\med\.agents\teamwork_preview_explorer_m3_3\analysis.md`

Also read the global project requirements in `c:/Users/gamin/Desktop/github/med/ORIGINAL_REQUEST.md` and `PROJECT.md`.

**Tasks**:
1. Initialize the React + Vite + TypeScript application in `frontend/` directory.
2. Set up the config files: `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`.
3. Set up the design tokens (HSL colors, Outfit/Inter fonts, glassmorphism, animations) in `frontend/src/styles/index.css`.
4. Create the TypeScript types in `frontend/src/types/` (for Gene, Variant, Disease, and Literature).
5. Implement mock data in `frontend/src/api/mockData.ts` (conform to Ensembl, UniProt, OpenTargets, ClinVar, gnomAD, GTEx, ChEMBL, ClinicalTrials.gov, and openFDA contracts).
6. Implement the custom hooks for searching and fetching data in `frontend/src/hooks/` (useSearch, useDebounce, useGeneData, useVariantData, useDiseaseData).
7. Implement client-side smart entity type detection (regex matching for genes, rsIDs/chromosomal variants, and cancer/disease terms).
8. Implement components:
   - `SearchBar/SearchBar.tsx` & `SuggestionList.tsx`: Autocompletion, arrow-key navigation, type badge.
   - `GenePanel/GenePanel.tsx`, `TranscriptsTable.tsx`, `UniProtDetails.tsx`: Ensembl transcripts, UniProt seq, OpenTargets associations.
   - `VariantPanel/VariantPanel.tsx`, `ClinVarCard.tsx`, `AlleleFreqChart.tsx` (recharts logarithmic global dial gauge + population bar chart), `GtexHeatmap.tsx` (CSS Grid/Flex GTEx heatmap using HSL color mapping for NES and p-value significance, and striped/hatch pattern overlay for non-significant cells).
   - `TherapeuticPanel/TherapeuticPanel.tsx`, `ChemblDrugsTable.tsx`, `ClinicalTrialsList.tsx` (paginated clinical trials), `OpenfdaAdverseEvents.tsx` (ADE term frequency bar chart + patient sex/age donut charts).
   - `LiteraturePanel/LiteraturePanel.tsx` & `PublicationCard.tsx`: Tabbed pub lists with abstract drawers and expand height transitions.
   - `MolViewer/MolViewer.tsx`: WebGL Mol* placeholder canvas with user click interaction activation overlay guard.
   - `StringNetwork/StringNetwork.tsx`: STRING node graph placeholder with activation guard.
   - `App.tsx`: Centralized dashboard layout using CSS grid. Searching for an entity must automatically cross-fetch and enrich the other panels (e.g. searching a variant fetches its target gene and the target gene's associated disease drugs/trials).
9. Ensure all elements carry the specified `data-testid` attributes (e.g. `data-testid="search-input"`, `data-testid="global-af-gauge"`, `data-testid="global-af-value"`, `data-testid="gnomad-pop-chart"`, `data-testid="gtex-heatmap-container"`, `data-testid="gtex-cell-{gene}-{tissue}"`, `data-testid="fda-events-chart"`, `data-testid="mol-viewer-container"`, `data-testid="mol-viewer-activation-guard"`, `data-testid="mol-viewer-loading"`).
10. Install packages and run `npm run build` in `frontend/` directory to ensure 100% successful compilation.

**Handoff Report**:
Write `handoff.md` to your working directory `c:/Users/gamin/Desktop/github/med/.agents/teamwork_preview_worker_m3/` listing files created, installation commands used, and the compilation/build results. Include actual output of the build command.
