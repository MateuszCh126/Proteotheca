# Project: BioMed Explorer Portal

## Architecture
BioMed Explorer is a high-fidelity research portal for med-tech developers, clinicians, and bio-engineers. It consists of:
1. **Backend**: FastAPI (Python) server serving REST endpoints. It aggregates data from multiple biological/medical APIs and integrates PyMOL for detailed publication-ready 3D rendering.
2. **Frontend**: React (TypeScript + Vite) SPA with a dark/glassmorphic theme. It features an embedded WebGL viewer (Mol* or 3Dmol.js) and interactive graphs (STRING network) and charts (gnomAD allele frequencies).

### Code Layout
```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI Application Entry
│   │   ├── config.py            # Configuration & Settings
│   │   ├── api/                 # Endpoint Routes
│   │   │   ├── genes.py
│   │   │   ├── variants.py
│   │   │   ├── diseases.py
│   │   │   ├── literature.py
│   │   │   └── pymol.py
│   │   └── services/            # Biological Database Services
│   │       ├── ensembl_service.py
│   │       ├── uniprot_service.py
│   │       ├── opentargets_service.py
│   │       ├── clinvar_service.py
│   │       ├── gnomad_service.py
│   │       ├── gtex_service.py
│   │       ├── chembl_service.py
│   │       ├── clinicaltrials_service.py
│   │       ├── openfda_service.py
│   │       ├── pubmed_service.py
│   │       └── pymol_service.py
│   ├── tests/                   # Pytest Mock Verification Suite
│   │   ├── test_genes.py
│   │   ├── test_variants.py
│   │   ├── test_diseases.py
│   │   └── test_pymol.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/          # Glassmorphic Widgets
│   │   │   ├── SearchBar.tsx
│   │   │   ├── MolViewer.tsx
│   │   │   ├── StringNetwork.tsx
│   │   │   ├── AlleleFreqChart.tsx
│   │   │   ├── GenePanel.tsx
│   │   │   ├── VariantPanel.tsx
│   │   │   ├── TherapeuticPanel.tsx
│   │   │   └── LiteraturePanel.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css            # Dark/glassmorphic Theme Styling
│   ├── package.json
│   └── vite.config.ts
├── tests_e2e/                   # E2E Test Suite (Opaque-box)
└── run_app.bat                  # Concurrent Startup Script
```

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Backend DB Services & APIs | Implement FastAPI routes & mockable database aggregation services for Genes, Variants, Diseases, and Literature. | None | IN_PROGRESS | 367e0f55-bcd6-4eda-9c7a-350fe953ea03 |
| 2 | PyMOL Rendering Service | Integrate PyMOL, implement image rendering endpoint. | M1 | PLANNED | TBD |
| 3 | React Dashboard UI & Styling | Design React dashboard layouts, panels, charts, search autocomplete, and glassmorphic UI. | None | IN_PROGRESS | 2d52d156-a875-4d8d-9de2-91e46d8f1696 |
| 4 | Interactive Mol* & Node Graphs | Add Mol* WebGL viewer and STRING node graph components. | M3 | PLANNED | TBD |
| 5 | E2E Integration | Connect Frontend and Backend, verify 100% E2E test compliance. | M1, M2, M3, M4 | PLANNED | TBD |
| 6 | Coverage Hardening (Tier 5) | Adversarial test coverage and bug resolution. | M5 | PLANNED | TBD |

## Interface Contracts

### 1. Gene Endpoint `/api/genes/{symbol}`
**Response JSON**:
```json
{
  "symbol": "BRAF",
  "ensembl": {
    "gene_id": "ENSG00000157764",
    "transcripts": [
      {
        "transcript_id": "ENST00000644969",
        "length": 2500
      }
    ]
  },
  "uniprot": {
    "accession": "P15056",
    "name": "BRAF_HUMAN",
    "sequence": "MAALSGGGG..."
  },
  "opentargets": {
    "target_id": "ENSG00000157764",
    "associations": [
      {
        "disease_id": "EFO_0000616",
        "disease_name": "melanoma",
        "score": 0.95
      }
    ]
  }
}
```

### 2. Variant Endpoint `/api/variants/{variant_id}`
*(Accepts rsID or chr:pos:ref>alt format)*
**Response JSON**:
```json
{
  "variant_id": "rs113488022",
  "clinvar": {
    "pathogenicity": "Pathogenic",
    "significance": "Clinical significance",
    "review_status": "criteria provided, single submitter"
  },
  "gnomad": {
    "allele_frequency": 0.0012,
    "homozygote_count": 0,
    "populations": [
      { "pop": "European", "freq": 0.002 }
    ]
  },
  "gtex": {
    "eqtls": [
      {
        "tissue": "Skin - Sun Exposed (Lower leg)",
        "gene_symbol": "BRAF",
        "p_value": 1.2e-8,
        "nes": 0.45
      }
    ]
  }
}
```

### 3. Disease Endpoint `/api/diseases/{disease_name}`
**Response JSON**:
```json
{
  "disease_name": "Melanoma",
  "opentargets": {
    "associated_genes": [
      { "symbol": "BRAF", "score": 0.95 }
    ]
  },
  "chembl": {
    "active_compounds": [
      {
        "chembl_id": "CHEMBL2103830",
        "name": "DABRAFENIB",
        "ic50_nm": 0.8
      }
    ]
  },
  "clinical_trials": {
    "trial_count": 142,
    "trials": [
      {
        "nct_id": "NCT01227889",
        "title": "Study of Dabrafenib in Patients With BRAF Mutation-Positive Melanoma",
        "status": "COMPLETED"
      }
    ]
  }
}
```

### 4. PyMOL Rendering Endpoint `/api/pymol/render`
**Request JSON (POST)**:
```json
{
  "pdb_id": "1UWH",
  "representation": "cartoon",
  "color_by": "plddt",
  "residues": [599, 600, 601]
}
```
**Response**: `image/png` binary content.
