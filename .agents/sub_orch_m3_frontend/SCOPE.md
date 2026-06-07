# Scope: Milestone 3 - React Dashboard UI & Styling

## Architecture
The frontend is built using React with TypeScript and Vite. It will feature:
- A single page application dashboard layout.
- Glassmorphic panels with transitions.
- Responsive data visualization components (Recharts for allele frequencies and heatmaps, Lucide React for iconography).
- UI structures structured to be easily targetable by E2E test suites (using descriptive `data-testid` properties).
- Mock data adapters that match the backend API contracts exactly, with seamless integration capability for the final endpoint connections.

## Sub-Milestones
| # | Sub-Milestone | Scope | Dependencies | Status |
|---|---------------|-------|-------------|--------|
| 3.1 | App Setup & Theme | Initialize React/Vite/TS app, install packages (Recharts, Lucide, etc.), configure custom global CSS with Outfit/Inter fonts and HSL dark glassmorphic variables. | None | PLANNED |
| 3.2 | Search Panel | Search bar with autocompletion list and entity detection (Gene vs. Variant vs. Disease). | 3.1 | PLANNED |
| 3.3 | Target & Pathway Panel | Display gene-specific info, Reactome pathways, and a styled container for the STRING network. | 3.1 | PLANNED |
| 3.4 | Variant Impact Panel | ClinVar pathogenicity data, gnomAD allele frequency charts/gauges, and GTEx tissue expression heatmap placeholder/mock-visualization. | 3.1 | PLANNED |
| 3.5 | Therapeutic Panel | List active ChEMBL drugs, ClinicalTrials.gov trials, and openFDA adverse event charts/tables. | 3.1 | PLANNED |
| 3.6 | Literature Panel | Display publications list with title, journal/source, and abstract summaries. | 3.1 | PLANNED |
| 3.7 | Dashboard Integration | Cohesively structure all panels in a responsive layout (sidebar/grid), add custom tabs, and transition states. | 3.2-3.6 | PLANNED |

## Interface Integration Contracts
The components will interface with mock-data services matching the following schemas (conforming to PROJECT.md):
- **Gene**: `symbol`, `ensembl: { gene_id, transcripts: [{ transcript_id, length }] }`, `uniprot: { accession, name, sequence }`, `opentargets: { target_id, associations: [{ disease_id, disease_name, score }] }`
- **Variant**: `variant_id`, `clinvar: { pathogenicity, significance, review_status }`, `gnomad: { allele_frequency, homozygote_count, populations: [{ pop, freq }] }`, `gtex: { eqtls: [{ tissue, gene_symbol, p_value, nes }] }`
- **Disease**: `disease_name`, `opentargets: { associated_genes: [{ symbol, score }] }`, `chembl: { active_compounds: [{ chembl_id, name, ic50_nm }] }`, `clinical_trials: { trial_count, trials: [{ nct_id, title, status }] }`
