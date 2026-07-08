# Project: BioMed Explorer Portal (Proteotheca)

## Architecture
BioMed Explorer (Proteotheca) is a high-fidelity research portal for med-tech developers, clinicians, and bio-engineers. It consists of:
1. **Backend**: FastAPI (Python) server serving REST endpoints. It aggregates data from 30+ biological/medical databases and APIs and integrates PyMOL for detailed publication-ready 3D rendering.
2. **Frontend**: React (TypeScript + Vite) SPA with a dark/glassmorphic theme. It features an embedded WebGL viewer (Mol* or 3Dmol.js) and interactive graphs (STRING network) and charts (gnomAD allele frequencies).

### Code Layout
```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI Application Entry
│   │   ├── config.py            # Configuration & Settings
│   │   ├── api/                 # Endpoint Routes
│   │   │   ├── genes.py         # Enriched gene metadata & associations
│   │   │   ├── variants.py      # Variant annotations, conservation, & scores
│   │   │   ├── diseases.py      # Disease target mappings & clinical trials
│   │   │   ├── literature.py    # Literature preprint & publication search
│   │   │   ├── pymol.py         # High-resolution static PyMOL renderings
│   │   │   └── analysis.py      # Sequence alignment & structural analysis
│   │   └── services/            # Biological Database Services (30+ databases)
│   │       ├── alphafold_service.py     # AlphaFold DB predicted structure metadata
│   │       ├── alphagenome_service.py   # AlphaGenome variant regulatory impact scores
│   │       ├── chembl_service.py        # ChEMBL bioactive compounds & drug targets
│   │       ├── clinicaltrials_service.py# ClinicalTrials.gov clinical trials mapping
│   │       ├── clinvar_service.py       # ClinVar pathogenicity classifications
│   │       ├── dbsnp_service.py         # dbSNP RS coordinate resolution
│   │       ├── ols_service.py           # EMBL-EBI Ontology Lookup Service
│   │       ├── encode_service.py        # ENCODE cCREs Registry overlapping elements
│   │       ├── ensembl_service.py       # Ensembl gene transcripts and sequences
│   │       ├── foldseek_service.py      # Foldseek 3D structure similarity search
│   │       ├── gnomad_service.py        # gnomAD population allele frequencies
│   │       ├── gtex_service.py          # GTEx tissue expression & eQTL mapping
│   │       ├── hpa_service.py           # Human Protein Atlas tissue localization
│   │       ├── interpro_service.py      # InterPro domain architecture/annotations
│   │       ├── jaspar_service.py        # JASPAR transcription factor binding profiles
│   │       ├── arxiv_service.py         # arXiv literature search
│   │       ├── europepmc_service.py     # EuropePMC literature search
│   │       ├── biorxiv_service.py       # bioRxiv/medRxiv preprint search
│   │       ├── openalex_service.py      # OpenAlex literature search
│   │       ├── pubmed_service.py        # PubMed publication search
│   │       ├── ncbi_service.py          # NCBI Sequence Fetch (protein/nucleotide)
│   │       ├── openfda_service.py       # openFDA adverse events & drug labels
│   │       ├── opentargets_service.py   # OpenTargets target-disease associations
│   │       ├── pdb_service.py           # RCSB PDB structures and metadata
│   │       ├── clustal_service.py       # Clustal Omega multiple sequence alignment
│   │       ├── blast_service.py         # BLAST/MMseqs2 sequence similarity
│   │       ├── pubchem_service.py       # PubChem compounds and properties
│   │       ├── quickgo_service.py       # QuickGO gene ontology mappings
│   │       ├── reactome_service.py      # Reactome pathways & hierarchy
│   │       ├── string_service.py        # STRING protein-protein interactions
│   │       ├── ucsc_service.py          # UCSC Conservation & TFBS scores
│   │       ├── unibind_service.py       # UniBind validated TF binding sites
│   │       └── pymol_service.py         # Headless PyMOL rendering engine
│   ├── tests/                   # Pytest Mock Verification Suite
│   │   ├── test_genes.py
│   │   ├── test_variants.py
│   │   ├── test_diseases.py
│   │   ├── test_pymol.py
│   │   ├── test_analysis.py
│   │   └── test_projects.py
│   ├── requirements.txt
│   └── run.py
```

## Integrated Services (30+ Databases)
The application leverages the following biological and medical databases:
1. **AlphaFold DB**: Fetches predicted structure metadata, pLDDT metrics, PDB/CIF file links.
2. **AlphaGenome**: Variant regulatory scores (quantiles and raw scores) across tissues.
3. **ChEMBL**: Active bioactive compounds, drug targets, IC50 values.
4. **ClinicalTrials.gov**: Completed, active, and recruiting clinical trials.
5. **ClinVar**: Variant pathogenicity summaries and clinical significance.
6. **dbSNP**: rsID to chromosomal coordinates maps and alleles.
7. **EMBL-EBI OLS**: Ontology terms, synonyms, parents, and descriptions.
8. **ENCODE cCREs Registry**: Overlapping promoter/enhancer cis-regulatory signatures.
9. **Ensembl**: Gene structures, transcripts, genomic coordinates.
10. **Foldseek**: Structural similarity search of 3D structures against RCSB and AlphaFold databases.
11. **gnomAD**: Population allele frequencies, homozygote counts, ethnicity-specific rates.
12. **GTEx**: Tissue expression heatmaps and eQTL expression patterns.
13. **Human Protein Atlas**: Semi-quantitative protein tissue localization and expression levels.
14. **InterPro**: Protein domain architectures, active site annotations, signatures.
15. **JASPAR**: TF binding profiles and Position Frequency Matrices (PFMs).
16. **PubMed**: Peer-reviewed medical literature publications.
17. **bioRxiv/medRxiv**: Preprints with abstracts and DOIs.
18. **arXiv**: Preprint literature search in quantitative biology.
19. **EuropePMC**: Open-access European medical publications.
20. **OpenAlex**: Global research publication metadata and metrics.
21. **NCBI Sequence Fetch**: RefSeq nucleotide and protein FASTA sequence retrieval.
22. **openFDA**: Drug labeling and adverse event reports.
23. **OpenTargets**: Target-disease associations and validation scores.
24. **RCSB PDB**: Structure deposition metadata, resolution, deposit dates.
25. **Clustal Omega**: Multiple sequence alignments (MSA) for sequence groups.
26. **BLAST/MMseqs2**: Sequence homology searches.
27. **PubChem**: Chemical formulas, canonical SMILES, IUPAC names, properties.
28. **QuickGO**: Gene Ontology (GO) mappings for biological process/molecular function.
29. **Reactome**: Biological pathways, reactions, hierarchy.
30. **STRING**: Protein-protein interaction networks and nodes.
31. **UCSC Conservation & TFBS**: Evolutionary phyloP/phastCons scores, regulatory tracks.
32. **UniBind**: Experimentally validated transcription factor binding datasets.
33. **PyMOL**: Publication-quality 3D ray-traced static rendering.

## Interface Contracts

### 1. Gene Endpoint `/api/genes/{symbol}`
**Response JSON**:
```json
{
  "symbol": "BRAF",
  "ensembl": {
    "gene_id": "ENSG00000157764",
    "transcripts": [{ "transcript_id": "ENST00000644969", "length": 2500 }]
  },
  "uniprot": {
    "accession": "P15056",
    "name": "BRAF_HUMAN",
    "sequence": "MAALSGGGG..."
  },
  "opentargets": {
    "target_id": "ENSG00000157764",
    "associations": [{ "disease_id": "EFO_0000616", "disease_name": "melanoma", "score": 0.95 }]
  },
  "alphafold": {
    "uniprot_id": "P15056",
    "entryId": "AF-P15056-F1",
    "pdbUrl": "https://alphafold.ebi.ac.uk/files/AF-P15056-F1-model_v4.pdb",
    "plddt_summary": { "very_high": 75.4, "confident": 15.2, "low": 6.3, "very_low": 3.1 }
  },
  "interpro": {
    "uniprot_id": "P15056",
    "domains": [{ "accession": "IPR001367", "name": "Protein kinase domain", "start": 450, "end": 710 }]
  },
  "jaspar": {
    "symbol": "BRAF",
    "profiles": [{ "matrix_id": "MA0001.1", "name": "BRAF", "pfm": { "A": [10, 20], "C": [5, 45], "G": [70, 5], "T": [15, 30] } }]
  },
  "ncbi_seq": {
    "accession": "P15056",
    "fasta": ">P15056 | mock sequence\nMAALSGGGG..."
  },
  "pdb_meta": {
    "pdb_id": "1UWH",
    "title": "Crystal structure of BRAF kinase domain",
    "resolution": 2.15,
    "release_date": "2012-10-15",
    "organisms": ["Homo sapiens"]
  },
  "quickgo": {
    "uniprot_id": "P15056",
    "annotations": [{ "go_id": "GO:0006468", "go_name": "protein phosphorylation", "evidence_code": "IDA" }]
  },
  "reactome": {
    "uniprot_id": "P15056",
    "pathways": [{ "dbId": 5673001, "displayName": "RAF/MAP kinase cascade", "stId": "R-HSA-5673001" }]
  },
  "string": {
    "symbol": "BRAF",
    "network": [{ "preferredName_A": "BRAF", "preferredName_B": "MAP2K1", "score": 0.999 }]
  },
  "hpa": {
    "symbol": "BRAF",
    "expression": [{ "tissue": "Cerebellum", "level": "High", "reliability": "Approved" }],
    "localization": ["Cytoplasm"]
  }
}
```

### 2. Variant Endpoint `/api/variants/{variant_id}`
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
    "populations": [{ "pop": "European", "freq": 0.002 }]
  },
  "gtex": {
    "eqtls": [{ "tissue": "Skin - Sun Exposed", "gene_symbol": "BRAF", "p_value": 1.2e-8, "nes": 0.45 }]
  },
  "alphagenome": {
    "variant_id": "rs113488022",
    "predictions": [{ "biosample_name": "liver", "output_type": "RNA-seq", "quantile_score": 0.998, "raw_score": 2.45 }]
  },
  "dbsnp": {
    "rsid": "rs113488022",
    "chromosome": "7",
    "position": 140753336,
    "ref": "T",
    "alt": "A",
    "gene": "BRAF"
  },
  "encode": {
    "ccres": [{ "accession": "EH38E2941922", "chrom": "7", "start": 140752336, "len": 2000, "pct": "pELS" }]
  },
  "ucsc": {
    "coordinate": "7:140753336-140753337",
    "phylop": 2.45,
    "phastcons": 0.985,
    "tfbs_overlaps": [{ "tf_name": "CTCF", "score": 950 }]
  }
}
```

### 3. Disease Endpoint `/api/diseases/{disease_name}`
**Response JSON**:
```json
{
  "disease_name": "Melanoma",
  "opentargets": {
    "associated_genes": [{ "symbol": "BRAF", "score": 0.95 }]
  },
  "chembl": {
    "active_compounds": [{ "chembl_id": "CHEMBL2103830", "name": "DABRAFENIB", "ic50_nm": 0.8 }]
  },
  "clinical_trials": {
    "trial_count": 142,
    "trials": [{ "nct_id": "NCT01227889", "title": "Study of Dabrafenib in Patients With BRAF", "status": "COMPLETED" }]
  },
  "openfda": {
    "active_substance": "DABRAFENIB",
    "total_reports": 1250,
    "events": [{"term": "Nausea", "count": 120}],
    "sex_breakdown": [{"name": "Male", "value": 600}],
    "age_breakdown": [{"name": "Adult", "value": 1100}]
  },
  "ols": {
    "obo_id": "DOID:9351",
    "label": "melanoma",
    "description": ["A disease of cellular proliferation that is malignant..."]
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

### 5. Analysis Endpoints
- **POST `/api/analysis/structures/foldseek`**: Run structural search against PDB.
- **POST `/api/analysis/sequence/align`**: Align multiple sequences.
- **POST `/api/analysis/sequence/similarity`**: Blast query sequence.
- **GET `/api/analysis/compounds/{query}`**: Fetch PubChem chemical properties.
- **GET `/api/analysis/tfbs/unibind/{tf_name}`**: Retrieve TF binding datasets.
