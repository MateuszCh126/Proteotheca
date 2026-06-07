# Component & State Flow Analysis: Search & Dashboard Panels (Milestone 3.2)

This report details the architectural proposal, component specifications, state management flow, and mock schemas for the BioMed Explorer search mechanism and core dashboard panels.

---

## 1. Mock Data Schemas (API Contracts)

The frontend interfaces with the FastAPI backend using standard models. The TypeScript definitions and realistic mock data instances below conform to the backend API contracts defined in the project scope.

### 1.1 Gene Data Model

```typescript
export interface EnsemblTranscript {
  transcript_id: string;
  length: number;
}

export interface EnsemblData {
  gene_id: string;
  transcripts: EnsemblTranscript[];
}

export interface UniProtData {
  accession: string;
  name: string;
  sequence: string;
}

export interface OpenTargetsAssociation {
  disease_id: string;
  disease_name: string;
  score: number; // Association strength [0.0 - 1.0]
}

export interface OpenTargetsGeneData {
  target_id: string;
  associations: OpenTargetsAssociation[];
}

export interface GeneData {
  symbol: string;
  ensembl: EnsemblData;
  uniprot: UniProtData;
  opentargets: OpenTargetsGeneData;
}
```

#### Mock Instance (`BRAF`):
```json
{
  "symbol": "BRAF",
  "ensembl": {
    "gene_id": "ENSG00000157764",
    "transcripts": [
      {
        "transcript_id": "ENST00000644969",
        "length": 2500
      },
      {
        "transcript_id": "ENST00000496384",
        "length": 890
      }
    ]
  },
  "uniprot": {
    "accession": "P15056",
    "name": "BRAF_HUMAN",
    "sequence": "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALLDKFGGEHNPPSIYLDAYEEYTSKLDALQQREQQLLESLGNGTDFSVSSSASMDTVTSSSSSSLSVLPSSLSVFQNPTDVARSNPKSPQKPIVRVFLPNKQRTVVPARCGVTVRDSLKKALMMRGLIPECCAVYRIQDGEKKPIGWDTDISWLTGEELHVEVLENVPLTTHNFVRKTFFTLAFCDFCRKLLFQGFRCQTCGYKFHQRCSTEVPLMCVNYDQLDLLFVSKFFEHHPIPQEEASLAETALTSGSSPSAPASDSIGPQILTSPSPSKSIPIPQPFRPADEDHRNQFGQRDRSSSAPNVHINTIEPVNIDDLIRDQGFRGDGGSTTGLSATPPASLPGSLTNVKALQKSPGPQRERKSSSSSEdrnrmktlgrrdssddweipdgqitvgqrigsgsfgtvykgkwhgdvavkmlnvtaptpqqlqafknevgvlrktrhvnillfmgystkpqlaivtwcegsslyhhlhiietkfemiklidiarqtaqgmdylhaksiihrdlksnniflhedltvkigdfglatvksrwsgshqfeqlsgsilwmapevirmqdknpysfqsdvyafgivlyelmtgqlpysninnrdqiifmvgrgylspdlskvrsncpkamkrlmaeclkkkrderplfpqilasieLLARSLaKIHRSASEPSLNTAGFQTEDFSLYACASPKTPIQAGGYGAFPVH"
  },
  "opentargets": {
    "target_id": "ENSG00000157764",
    "associations": [
      {
        "disease_id": "EFO_0000616",
        "disease_name": "Melanoma",
        "score": 0.95
      },
      {
        "disease_id": "EFO_0000311",
        "disease_name": "Colorectal Cancer",
        "score": 0.82
      },
      {
        "disease_id": "EFO_0000305",
        "disease_name": "Thyroid Carcinoma",
        "score": 0.78
      }
    ]
  }
}
```

---

### 1.2 Genetic Variant Data Model

```typescript
export interface ClinVarData {
  pathogenicity: "Pathogenic" | "Likely Pathogenic" | "Benign" | "Likely Benign" | "Uncertain Significance";
  significance: string;
  review_status: string;
}

export interface GnomadPopulation {
  pop: string;
  freq: number;
}

export interface GnomadData {
  allele_frequency: number;
  homozygote_count: number;
  populations: GnomadPopulation[];
}

export interface GtexEQTL {
  tissue: string;
  gene_symbol: string;
  p_value: number;
  nes: number; // Normalized Effect Size
}

export interface GtexData {
  eqtls: GtexEQTL[];
}

export interface VariantData {
  variant_id: string;
  clinvar: ClinVarData;
  gnomad: GnomadData;
  gtex: GtexData;
}
```

#### Mock Instance (`rs113488022` - BRAF V600E):
```json
{
  "variant_id": "rs113488022",
  "clinvar": {
    "pathogenicity": "Pathogenic",
    "significance": "Somatic variation associated with drug response, cancer predisposition",
    "review_status": "criteria provided, single submitter"
  },
  "gnomad": {
    "allele_frequency": 0.0012,
    "homozygote_count": 0,
    "populations": [
      { "pop": "European (Non-Finnish)", "freq": 0.0021 },
      { "pop": "African/African-American", "freq": 0.0001 },
      { "pop": "East Asian", "freq": 0.0003 },
      { "pop": "Latino/Admixed American", "freq": 0.0008 }
    ]
  },
  "gtex": {
    "eqtls": [
      {
        "tissue": "Skin - Sun Exposed (Lower leg)",
        "gene_symbol": "BRAF",
        "p_value": 1.2e-8,
        "nes": 0.45
      },
      {
        "tissue": "Skin - Not Sun Exposed (Suprapubic)",
        "gene_symbol": "BRAF",
        "p_value": 3.4e-7,
        "nes": 0.38
      },
      {
        "tissue": "Thyroid",
        "gene_symbol": "BRAF",
        "p_value": 1.5e-5,
        "nes": 0.22
      }
    ]
  }
}
```

---

### 1.3 Disease/Indication Data Model

```typescript
export interface OpenTargetsAssociatedGene {
  symbol: string;
  score: number; // Gene-disease association score
}

export interface OpenTargetsDiseaseData {
  associated_genes: OpenTargetsAssociatedGene[];
}

export interface ChEMBLActiveCompound {
  chembl_id: string;
  name: string;
  ic50_nm: number; // IC50 value in nanomolar units
}

export interface ChEMBLData {
  active_compounds: ChEMBLActiveCompound[];
}

export interface ClinicalTrial {
  nct_id: string;
  title: string;
  status: "COMPLETED" | "RECRUITING" | "ACTIVE_NOT_RECRUITING" | "TERMINATED" | "UNKNOWN" | "NOT_YET_RECRUITING";
}

export interface ClinicalTrialsData {
  trial_count: number;
  trials: ClinicalTrial[];
}

export interface DiseaseData {
  disease_name: string;
  opentargets: OpenTargetsDiseaseData;
  chembl: ChEMBLData;
  clinical_trials: ClinicalTrialsData;
}
```

#### Mock Instance (`Melanoma`):
```json
{
  "disease_name": "Melanoma",
  "opentargets": {
    "associated_genes": [
      { "symbol": "BRAF", "score": 0.95 },
      { "symbol": "NRAS", "score": 0.88 },
      { "symbol": "CDKN2A", "score": 0.81 },
      { "symbol": "KIT", "score": 0.65 }
    ]
  },
  "chembl": {
    "active_compounds": [
      {
        "chembl_id": "CHEMBL2103830",
        "name": "DABRAFENIB",
        "ic50_nm": 0.8
      },
      {
        "chembl_id": "CHEMBL1229594",
        "name": "VEMURAFENIB",
        "ic50_nm": 1.2
      },
      {
        "chembl_id": "CHEMBL2107827",
        "name": "TRAMETINIB",
        "ic50_nm": 0.92
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
      },
      {
        "nct_id": "NCT02224781",
        "title": "Dabrafenib Plus Trametinib in BRAF V600 mutant Melanoma Brain Metastases",
        "status": "COMPLETED"
      },
      {
        "nct_id": "NCT04516395",
        "title": "A Study of Pembrolizumab with Dabrafenib and Trametinib in Advanced Melanoma",
        "status": "RECRUITING"
      }
    ]
  }
}
```

---

### 1.4 Literature Data Model

```typescript
export interface PubmedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pub_date: string;
  abstract: string;
  doi: string;
}

export interface BiorxivArticle {
  doi: string;
  title: string;
  authors: string;
  pub_date: string;
  abstract: string;
}

export interface OpenalexArticle {
  id: string;
  title: string;
  authors: string;
  pub_date: string;
  abstract: string;
  doi: string;
}

export interface LiteratureData {
  query: string;
  pubmed: PubmedArticle[];
  biorxiv: BiorxivArticle[];
  openalex: OpenalexArticle[];
}
```

#### Mock Instance (`BRAF`):
```json
{
  "query": "BRAF",
  "pubmed": [
    {
      "pmid": "31234567",
      "title": "Mechanisms of Resistance to BRAF Inhibitors in Melanoma",
      "authors": "Smith J, Doe A, Patel M",
      "journal": "Nature Reviews Cancer",
      "pub_date": "2020-05-12",
      "abstract": "In patients with BRAF V600 mutations, resistance to targeted BRAF inhibitors occurs frequently via reactivating the MAPK pathway. We explore genomic alterations and feedback loops that limit overall clinical efficacy...",
      "doi": "10.1038/nrc.2020.12"
    }
  ],
  "biorxiv": [
    {
      "doi": "10.1101/2021.01.01.123456",
      "title": "Single-cell Transcriptomics Reveals Adaptive Rewiring Under BRAF Inhibition",
      "authors": "Johnson R, Lee K, Zhao X",
      "pub_date": "2021-01-02",
      "abstract": "Applying single-cell RNA sequencing to BRAF-mutated melanoma cells under Vemurafenib treatment demonstrates rapid upregulation of neural crest stem cell markers. This population drives transient drug tolerance..."
    }
  ],
  "openalex": [
    {
      "id": "https://openalex.org/W3012345678",
      "title": "A Global Registry Study on BRAF Alterations in Rare Tumors",
      "authors": "Gomez L, Kim S, Dupont L",
      "pub_date": "2019-11-20",
      "abstract": "We analyze BRAF V600E and non-V600E mutations across non-small cell lung cancer, anaplastic thyroid cancer, and cholangiocarcinoma. High response rates to Dabrafenib combination therapies suggest tissue-agnostic utility...",
      "doi": "10.1158/2159-8290.CD-19-0345"
    }
  ]
}
```

---

## 2. Component Specifications

The front-end layout uses a dark, glassmorphic design theme. All elements include clear semantic markers such as `data-testid` to support the E2E verification test suite.

### 2.1 SearchBar Component

#### Purpose
Renders an intelligent input bar with auto-detection of search entities, live validation markers (pills), and custom key-down navigation for search suggestions.

```typescript
export interface SearchBarProps {
  onSearch: (query: string, detectedType: 'gene' | 'variant' | 'disease' | 'unknown') => void;
  isLoading: boolean;
  error: string | null;
}
```

```typescript
// Component Internal State
interface SearchBarState {
  inputValue: string;
  suggestions: string[];
  detectedType: 'gene' | 'variant' | 'disease' | 'unknown';
  isFocused: boolean;
  highlightedIndex: number;
}
```

#### Layout and UI Spec
- **Glassmorphic Shell**: A wide pill-shaped container `bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg rounded-full flex items-center px-4 py-2 hover:border-cyan-500/30 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all duration-300`.
- **Entity Type Pill Badge**: Fades in or dynamically changes colors depending on the `detectedType` state:
  - `GENE` (Green): `bg-emerald-500/10 text-emerald-400 border border-emerald-500/25`
  - `VARIANT` (Amber): `bg-amber-500/10 text-amber-400 border border-amber-500/25`
  - `DISEASE` (Purple): `bg-purple-500/10 text-purple-400 border border-purple-500/25`
  - `UNKNOWN` (Gray): `bg-slate-500/10 text-slate-400 border border-slate-500/25`
- **Suggestions Overlay Dropdown**: Positioned absolute, sliding in below the bar: `absolute left-0 right-0 mt-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 animate-in fade-in-50 slide-in-from-top-2 duration-150`.
- **Suggestions Navigation**: Intercepts `ArrowUp`, `ArrowDown`, `Enter`, and `Escape` key events to modify `highlightedIndex` or confirm a selection.

#### Playwright Target Properties
- `input` element: `data-testid="search-input"`
- Suggestion dropdown: `data-testid="search-suggestions"`
- Suggestion option item: `data-testid="suggestion-item-{index}"`
- Entity detection badge: `data-testid="search-detected-badge"`

---

### 2.2 GenePanel Component (Target & Pathway Panel)

#### Purpose
Displays the Ensembl transcript metrics, UniProt sequence details, Reactome biological pathways, and provides a target canvas for the STRING interaction graph.

```typescript
export interface GenePanelProps {
  geneData: GeneData | null;
  isLoading: boolean;
}
```

```typescript
// Component Internal State
interface GenePanelState {
  selectedTranscriptId: string | null;
  activeTab: 'transcripts' | 'pathways' | 'network';
}
```

#### Layout and UI Spec
- **Panel Header**: Displays the active symbol (e.g., `BRAF`) in high-contrast text alongside its UniProt name (`BRAF_HUMAN`) and a link to the OpenTargets details page.
- **Transcripts Tab**: Displays transcripts in a table layout (`data-testid="transcripts-table"`). Highlighting active rows triggers `selectedTranscriptId` state update, displaying the nucleotide sequence length in a styled sidebar.
- **Pathways Tab**: Renders Reactome pathway identifiers and disease associations as a vertical list of cards with association scoring indicators (color-coded bars corresponding to the `opentargets.associations` score).
- **STRING Network Container**: A glassmorphic card container `w-full h-[400px] border border-white/5 rounded-2xl bg-slate-950/30 flex items-center justify-center relative overflow-hidden`. Features a target overlay container (`data-testid="string-network-container"`) where the D3/STRING node graph component will render (displaying a CSS loading spinner or SVG skeleton when no data is loaded).

#### Playwright Target Properties
- Main component panel: `data-testid="gene-panel"`
- Transcript rows: `data-testid="transcript-row-{id}"`
- STRING graph canvas: `data-testid="string-network-container"`
- OpenTargets associations: `data-testid="opentargets-association-row"`

---

### 2.3 TherapeuticPanel Component

#### Purpose
Displays potential drugs targeting the current disease indication, relevant clinical trials, and FDA adverse event lists.

```typescript
export interface TherapeuticPanelProps {
  diseaseData: DiseaseData | null;
  isLoading: boolean;
}
```

```typescript
// Component Internal State
interface TherapeuticPanelState {
  trialStatusFilter: 'ALL' | 'COMPLETED' | 'RECRUITING';
  trialsSortOrder: 'asc' | 'desc';
  currentTrialsPage: number;
}
```

#### Layout and UI Spec
- **Sub-Panels Grid**: A responsive grid containing three columns (or panels):
  1. **ChEMBL Active Drugs**: Renders cards displaying chemical identifiers (`CHEMBL2103830`), compound name (`Dabrafenib`), and binding affinity metrics (`IC50: 0.8 nM`). A chip glows green if `ic50_nm < 10` indicating highly potent therapeutic agents.
  2. **ClinicalTrials.gov Registry Table**: Lists NCT IDs with status pills. The column headers are clickable to change sorting parameters (mutating `trialsSortOrder` or switching pagination pages `currentTrialsPage`).
  3. **openFDA Adverse Events Widget**: Generates an outline table or SVG chart detailing symptoms (e.g., "Pyrexia", "Headache") reported by clinicians using standard openFDA fields.
- **Aesthetic**: All tables feature sticky headers, glassmorphic row dividing lines (`border-b border-white/5`), and interactive hover highlights (`hover:bg-white/5 cursor-pointer`).

#### Playwright Target Properties
- Main panel: `data-testid="therapeutic-panel"`
- Drug card rows: `data-testid="chembl-drug-card"`
- NCT Clinical trial rows: `data-testid="clinical-trial-row-{nct_id}"`
- Clinical trial status indicator: `data-testid="trial-status-badge"`

---

### 2.4 LiteraturePanel Component

#### Purpose
Consolidates search findings from PubMed, bioRxiv, and OpenAlex, allowing researchers to review abstracts and copy citation DOIs.

```typescript
export interface LiteraturePanelProps {
  literatureData: LiteratureData | null;
  isLoading: boolean;
}
```

```typescript
// Component Internal State
interface LiteraturePanelState {
  activeSourceTab: 'ALL' | 'PUBMED' | 'BIORXIV' | 'OPENALEX';
  expandedArticleKey: string | null; // Stores doi or pmid of active abstract
}
```

#### Layout and UI Spec
- **Platform Filter Tabs**: Standard tab bar showing item count tags next to label names (e.g., `PubMed (12)`, `bioRxiv (4)`).
- **Literature Card Item**: Cards that consist of:
  - Header: Article title, authors list (shortened with ellipsis if long), journal name, and publication date.
  - Source Indicator Chip: Color-coded based on the source platform (`PubMed` -> blue, `bioRxiv` -> amber, `OpenAlex` -> violet).
  - DOI / PMID link: A button to copy the citation or open it in a new window.
  - Expandable Abstract Drawer: An accordion element (`data-testid="abstract-drawer"`). Clicking the card header toggles the `expandedArticleKey` state, unfolding the complete scientific abstract with a height transition animation (`transition-all duration-300 ease-in-out`).

#### Playwright Target Properties
- Main panel: `data-testid="literature-panel"`
- Article cards: `data-testid="literature-card"`
- Expand button: `data-testid="literature-expand-btn-{id}"`
- DOI citation links: `data-testid="literature-doi-link"`

---

## 3. Input Handling, Entity Detection, and State Flow

To build a premium interactive dashboard, searching for an entity must automatically enrich the other panels through a connected state flow.

### 3.1 Entity Type Detection Strategy

The front-end parses input character sequences in real-time, matching queries against structural regex rules to classify search parameters.

```
                  [User Inputs Query String]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           [Matches Variant?]      [Matches Gene?]
           (rsID or coords)        (2-10 chars alpha-num)
                    │                   │
           ┌────────┴────────┐          ├───────── YES ──► [GENE Type]
           ▼                 ▼          │
        (rsID)           (coords)       ▼
      rs113488022     chr7:140753336    [Otherwise...]
           │                 │          │
           └────────┬────────┘          ▼
                    ▼              [Matches Disease?]
              [VARIANT Type]       (Contains disease keywords
                                    or multi-word string)
                                        │
                                        ├───────── YES ──► [DISEASE Type]
                                        ▼
                                   [UNKNOWN Type]
```

#### Code Logic Pattern
```typescript
export type EntityType = 'gene' | 'variant' | 'disease' | 'unknown';

export function detectEntityType(query: string): EntityType {
  const trimmed = query.trim();
  if (!trimmed) return 'unknown';

  // 1. Variant Detect: rsID (e.g., rs113488022) or Chromosomal coordinates (e.g., chr7:140753336:A>T or 7:140753336:A>T)
  const rsIdPattern = /^rs\d+$/i;
  const chromosomalPattern = /^(chr)?([1-9XY]|1\d|2[0-2]):\d+:[ACTG]+>[ACTG]+$/i;
  
  if (rsIdPattern.test(trimmed) || chromosomalPattern.test(trimmed)) {
    return 'variant';
  }

  // 2. Gene Detect: standard uppercase/lowercase alphanumeric symbols, length 2 to 10.
  // Example: BRAF, EGFR, TP53, ERBB2, BRCA1.
  const genePattern = /^[A-Z0-9-]{2,10}$/i;
  
  // Specific common gene symbol exceptions check or static dictionary check
  const knownGenes = new Set(['BRAF', 'EGFR', 'TP53', 'BRCA1', 'BRCA2', 'KRAS', 'ALK', 'PIK3CA', 'KIT', 'NRAS']);
  if (genePattern.test(trimmed)) {
    // If it looks like a gene or is in our subset of known symbols, classify as gene
    if (knownGenes.has(trimmed.toUpperCase()) || !/\s/.test(trimmed)) {
      return 'gene';
    }
  }

  // 3. Disease Detect: contains spaces, or matches standard cancer/disease terms.
  const diseaseKeywords = /(cancer|melanoma|tumor|carcinoma|lymphoma|sarcoma|syndrome|disease|diabetes|sclerosis|arthritis|glioma)/i;
  if (diseaseKeywords.test(trimmed) || trimmed.split(/\s+/).length >= 2) {
    return 'disease';
  }

  return 'unknown';
}
```

---

### 3.2 Dashboard State Management Flow

Rather than managing state in isolated views, the dashboard uses a centralized app state container (`App.tsx` state or a React Context Provider) to coordinate API requests and populates all relevant panels concurrently.

#### Centralized State Interface
```typescript
interface DashboardGlobalState {
  activeSearchQuery: string;
  activeSearchType: EntityType;
  
  // Loaded Entities
  loadedGene: GeneData | null;
  loadedVariant: VariantData | null;
  loadedDisease: DiseaseData | null;
  loadedLiterature: LiteratureData | null;
  
  // UI Loading & Global Error States
  isLoading: boolean;
  error: string | null;
}
```

```
                   ┌──────────────────────────────────┐
                   │    User Submits Search Query     │
                   └─────────────────┬────────────────┘
                                     │
                                     ▼
                   ┌──────────────────────────────────┐
                   │   Detect Entity Type (Sec 3.1)   │
                   └─────────────────┬────────────────┘
                                     │
           ┌─────────────────────────┼────────────────────────┐
           ▼                         ▼                        ▼
     [Type: GENE]             [Type: VARIANT]          [Type: DISEASE]
           │                         │                        │
     Fetch:                  Fetch:                   Fetch:
     1. /api/genes/{ID}      1. /api/variants/{ID}    1. /api/diseases/{ID}
     2. /api/literature      2. Get GTEx Gene Symbol  2. Get Top Gene
            │                        │                        │
            ▼                        ▼                        ▼
     Cross-fetch:            Cross-fetch:             Cross-fetch:
     - Top disease from      - Fetch Gene             - Fetch Gene info for
       target association      information              associated gene
     - Populate              - Fetch Literature       - Fetch Literature
       TherapeuticPanel        for that Gene            for Disease
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                     │
                                     ▼
                   ┌──────────────────────────────────┐
                   │   Update Central Dashboard State │
                   │   & Render CSS Fade-in Panels    │
                   └──────────────────────────────────┘
```

#### Cross-Panel Population Actions (Linking Logic)

1. **GENE Searched (e.g. `BRAF`)**:
   - **Main Fetch**: Request `GET /api/genes/BRAF` and `GET /api/literature?query=BRAF`.
   - **Cross-Panel Actions**: 
     - Populate `GenePanel` and `LiteraturePanel` directly.
     - Inspect `opentargets.associations` in the gene payload. Retrieve the highest-scoring associated disease (`EFO_0000616` / `"Melanoma"`, score: `0.95`).
     - Trigger a secondary fetch `GET /api/diseases/Melanoma`. Populate the `TherapeuticPanel` with Melanoma drugs and clinical trials automatically.
     - Keep the `VariantImpactPanel` in an inactive/placeholder state or show common known mutations associated with the BRAF gene.

2. **VARIANT Searched (e.g. `rs113488022`)**:
   - **Main Fetch**: Request `GET /api/variants/rs113488022`.
   - **Cross-Panel Actions**:
     - Populate `VariantImpactPanel` with ClinVar and gnomAD results.
     - Inspect the GTEx tissue expression list. Identify the primary target gene affected by this variant (e.g., `eqtls[0].gene_symbol` -> `"BRAF"`).
     - Trigger concurrent requests: `GET /api/genes/BRAF`, `GET /api/diseases/Melanoma` (from BRAF associations), and `GET /api/literature?query=BRAF`.
     - Update the dashboard state, populating all panels concurrently. This gives clinicians immediate context on the gene target, therapeutics, and literature associated with the variant.

3. **DISEASE Searched (e.g. `Melanoma`)**:
   - **Main Fetch**: Request `GET /api/diseases/Melanoma` and `GET /api/literature?query=Melanoma`.
   - **Cross-Panel Actions**:
     - Populate `TherapeuticPanel` and `LiteraturePanel`.
     - Inspect `opentargets.associated_genes` in the disease payload. Retrieve the top-associated gene (`"BRAF"`, score: `0.95`).
     - Trigger secondary fetch `GET /api/genes/BRAF`. Populate the `GenePanel` with BRAF transcript structures and load the molecular structure placeholder.
     - Clear the `VariantImpactPanel` state and instruct the clinician to select a specific variant coordinates or rsID to analyze single nucleotide polymorphism (SNP) details.
