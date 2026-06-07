# BioMed Explorer Portal - Biological & Literature Data Integration Analysis Report

This report provides a comprehensive, read-only analysis of the external REST/GraphQL API integration required for **Milestone 1 Backend DB Services & APIs**. It documents the precise external endpoints, request query formats, response structures, payload mappings, and mock JSON payloads matching the interface contracts in `PROJECT.md` and `SCOPE.md`.

---

## Table of Contents
1. [Gene Endpoint Analysis (`/api/genes/{symbol}`)](#1-gene-endpoint-analysis-apigenessymbol)
2. [Variant Endpoint Analysis (`/api/variants/{variant_id}`)](#2-variant-endpoint-analysis-apivariantsvariant_id)
3. [Disease Endpoint Analysis (`/api/diseases/{disease_name}`)](#3-disease-endpoint-analysis-apidiseasesdisease_name)
4. [Literature Endpoint Analysis (`/api/literature?query=...`)](#4-literature-endpoint-analysis-apiliteraturequery)
5. [Recommended Backend Architecture & Service Layout](#5-recommended-backend-architecture--service-layout)
6. [Comprehensive Mock Payloads (FastAPI Contracts)](#6-comprehensive-mock-payloads-fastapi-contracts)

---

## 1. Gene Endpoint Analysis (`/api/genes/{symbol}`)

The Gene endpoint consolidates data from **Ensembl**, **UniProt**, and **OpenTargets** into a unified record for a given HGNC gene symbol (e.g., `"BRAF"`).

### 1.1 Ensembl Integration
Ensembl provides the primary genomic coordinate mapping, stable Ensembl Gene ID, and transcript lengths.

*   **Primary API Base**: `https://rest.ensembl.org`
*   **Endpoint 1 (ID Resolution)**: `/lookup/symbol/homo_sapiens/{symbol}`
    *   **Method**: `GET`
    *   **Headers**: `Content-Type: application/json`
    *   **Target URL**: `https://rest.ensembl.org/lookup/symbol/homo_sapiens/BRAF?expand=1` (expanding fetches transcript details directly)
    *   **Response Path**:
        *   `gene_id` $\leftarrow$ `id` (e.g., `ENSG00000157764`)
        *   `transcripts` $\leftarrow$ `Transcript` list:
            *   `transcript_id` $\leftarrow$ `Transcript[i].id`
            *   `length` $\leftarrow$ `Transcript[i].length`
*   **Alternate API (Batch Transcript Overlap)**: `/overlap/id/{gencode_id}?feature=exon`
    *   **Target URL**: `https://rest.ensembl.org/overlap/id/ENSG00000157764?feature=transcript;content-type=application/json`

### 1.2 UniProt Integration
UniProt provides the corresponding protein accession, canonical mnemonic/name, and amino acid sequence.

*   **Primary API Base**: `https://rest.uniprot.org`
*   **Endpoint**: `/uniprotkb/search`
    *   **Method**: `GET`
    *   **Parameters**:
        *   `query`: `gene:{symbol} AND organism_id:9606` (limits search to human)
        *   `format`: `json`
        *   `fields`: `accession,id,sequence` (selects only required fields to save bandwidth)
    *   **Target URL**: `https://rest.uniprot.org/uniprotkb/search?query=gene:BRAF+AND+organism_id:9606&format=json&fields=accession,id,sequence`
    *   **Response Path**:
        *   `accession` $\leftarrow$ `results[0].primaryAccession` (e.g., `"P15056"`)
        *   `name` $\leftarrow$ `results[0].uniProtkbId` (e.g., `"BRAF_HUMAN"`)
        *   `sequence` $\leftarrow$ `results[0].sequence.value` (e.g., `"MAALSGGGG..."`)

### 1.3 OpenTargets Integration
OpenTargets provides disease association scores for targets based on genetic evidence, somatic mutations, and drugs.

*   **Primary API Base**: `https://api.platform.opentargets.org/api/v4/graphql`
*   **Method**: `POST`
*   **GraphQL Query**:
    ```graphql
    query TargetAssociations($ensemblId: String!) {
      target(id: $ensemblId) {
        id
        associatedDiseases(page: { size: 10, index: 0 }) {
          rows {
            disease {
              id
              name
            }
            score
          }
        }
      }
    }
    ```
*   **Variables**: `{"ensemblId": "ENSG00000157764"}`
*   **Response Path**:
    *   `associations` $\leftarrow$ `data.target.associatedDiseases.rows`:
        *   `disease_id` $\leftarrow$ `rows[i].disease.id` (e.g., `"EFO_0000616"`)
        *   `disease_name` $\leftarrow$ `rows[i].disease.name` (e.g., `"melanoma"`)
        *   `score` $\leftarrow$ `rows[i].score` (e.g., `0.95`)

---

## 2. Variant Endpoint Analysis (`/api/variants/{variant_id}`)

The Variant endpoint supports resolving variant identification (by dbSNP rsID, e.g., `"rs113488022"`, or chromosomal coordinate format, e.g., `"7:140753336:A:T"` / `"7-140753336-A-T"`) using **ClinVar**, **gnomAD**, and **GTEx**.

### 2.1 ClinVar Integration
ClinVar resolves clinical significance, pathogenicity, and review status.

*   **Primary API Base**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
*   **Step 1 (Search Variant ID)**: `esearch.fcgi`
    *   **Method**: `GET`
    *   **Parameters**: `db=clinvar&term={variant_id}&retmode=json`
    *   **Target URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=rs113488022&retmode=json`
    *   **Result**: Resolves to a ClinVar UID / Variation ID (e.g., `"13992"`).
*   **Step 2 (Get Top-Line Summary)**: `esummary.fcgi`
    *   **Method**: `GET`
    *   **Parameters**: `db=clinvar&id={uid}&retmode=json`
    *   **Target URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=13992&retmode=json`
    *   **Response Path**:
        *   `pathogenicity` $\leftarrow$ `result.{uid}.clinical_significance.description` (e.g., `"Pathogenic"`)
        *   `significance` $\leftarrow$ `result.{uid}.clinical_significance.description` (or `"Clinical significance"`)
        *   `review_status` $\leftarrow$ `result.{uid}.clinical_significance.review_status` (e.g., `"criteria provided, single submitter"`)

### 2.2 gnomAD Integration
gnomAD provides population frequency statistics for variants.

*   **Primary API Base**: `https://gnomad.broadinstitute.org/api`
*   **Method**: `POST`
*   **Step 1 (Resolve rsID to gnomAD Variant ID)**:
    ```graphql
    query ResolveRsid($query: String!, $dataset: DatasetId!) {
      variant_search(query: $query, dataset: $dataset) {
        variant_id
      }
    }
    ```
    *   **Variables**: `{"query": "rs113488022", "dataset": "gnomad_r4"}`
    *   *Result*: Resolves to gnomAD variant ID `7-140753336-A-T`.
*   **Step 2 (Fetch Variant Frequency)**:
    ```graphql
    query GetVariantFreq($variantId: String!, $dataset: DatasetId!) {
      variant(variantId: $variantId, dataset: $dataset) {
        variant_id
        genome {
          af
          homozygote_count
          populations {
            id
            ac
            an
          }
        }
      }
    }
    ```
    *   **Variables**: `{"variantId": "7-140753336-A-T", "dataset": "gnomad_r4"}`
    *   **Response Path**:
        *   `allele_frequency` $\leftarrow$ `data.variant.genome.af`
        *   `homozygote_count` $\leftarrow$ `data.variant.genome.homozygote_count`
        *   `populations` $\leftarrow$ `data.variant.genome.populations`:
            *   `pop` $\leftarrow$ Map standard identifiers (e.g., `"nfe"` $\rightarrow$ `"European"`, `"afr"` $\rightarrow$ `"African"`)
            *   `freq` $\leftarrow$ Calculated as `ac / an` (if not returned directly)

### 2.3 GTEx Integration
GTEx resolves expression Quantitative Trait Loci (eQTLs) for the variant.

*   **Primary API Base**: `https://gtexportal.org/api/v2`
*   **Endpoint**: `/association/singleTissueEqtl`
    *   **Method**: `GET`
    *   **Parameters**:
        *   `variantId`: Constructed as `chr{chrom}_{pos}_{ref}_{alt}_b38` (e.g., `chr7_140753336_A_T_b38`) or using `rsID` (e.g., `rs113488022`)
        *   `datasetId`: `gtex_v10`
    *   **Target URL**: `https://gtexportal.org/api/v2/association/singleTissueEqtl?variantId=chr7_140753336_A_T_b38&datasetId=gtex_v10`
    *   **Response Path**:
        *   `eqtls` $\leftarrow$ `data` array:
            *   `tissue` $\leftarrow$ `data[i].tissueSiteDetailId` (mapped back to friendly name via tissue mapping endpoint `/dataset/tissueSiteDetail`)
            *   `gene_symbol` $\leftarrow$ `data[i].geneSymbol`
            *   `p_value` $\leftarrow$ `data[i].pValue`
            *   `nes` $\leftarrow$ `data[i].nes`

---

## 3. Disease Endpoint Analysis (`/api/diseases/{disease_name}`)

The Disease endpoint aggregates information about the disease from **OpenTargets**, **ChEMBL**, and **ClinicalTrials.gov**.

### 3.1 OpenTargets Integration
Used to find genes associated with the disease.

*   **Primary API Base**: `https://api.platform.opentargets.org/api/v4/graphql`
*   **Method**: `POST`
*   **GraphQL Query (Resolve Disease and Get Associated Genes)**:
    ```graphql
    query DiseaseAssociations($diseaseName: String!) {
      search(queryString: $diseaseName, entityNames: ["disease"]) {
        hits {
          id
          name
        }
      }
    }
    ```
    *   Once EFO ID is resolved (e.g., `"EFO_0000616"` for Melanoma):
    ```graphql
    query DiseaseTargets($diseaseId: String!) {
      disease(id: $diseaseId) {
        associatedTargets(page: { size: 10, index: 0 }) {
          rows {
            target {
              approvedSymbol
            }
            score
          }
        }
      }
    }
    ```
    *   **Variables**: `{"diseaseId": "EFO_0000616"}`
    *   **Response Path**:
        *   `associated_genes` $\leftarrow$ `data.disease.associatedTargets.rows`:
            *   `symbol` $\leftarrow$ `rows[i].target.approvedSymbol` (e.g., `"BRAF"`)
            *   `score` $\leftarrow$ `rows[i].score` (e.g., `0.95`)

### 3.2 ChEMBL Integration
Used to retrieve active compounds for the disease by querying bioactivities (IC50) for targets associated with the disease.

*   **Primary API Base**: `https://www.ebi.ac.uk/chembl/api/data`
*   **Step 1 (Resolve Target to ChEMBL ID)**: `target.json`
    *   **Method**: `GET`
    *   **Query**: `target_components__accession={uniprot_accession}`
    *   **Target URL**: `https://www.ebi.ac.uk/chembl/api/data/target.json?target_components__accession=P15056`
    *   *Result*: Resolves to target ChEMBL ID (e.g., `"CHEMBL203"`).
*   **Step 2 (Fetch Active Compounds/Activities)**: `activity.json`
    *   **Method**: `GET`
    *   **Query**: `target_chembl_id={target_chembl_id}&standard_type=IC50&standard_units=nM&limit=5&sort=-standard_value`
    *   **Target URL**: `https://www.ebi.ac.uk/chembl/api/data/activity.json?target_chembl_id=CHEMBL203&standard_type=IC50&limit=5`
    *   **Response Path**:
        *   `active_compounds` $\leftarrow$ `activities` array:
            *   `chembl_id` $\leftarrow$ `activities[i].molecule_chembl_id` (e.g., `"CHEMBL2103830"`)
            *   `name` $\leftarrow$ `activities[i].molecule_pref_name` (e.g., `"DABRAFENIB"`)
            *   `ic50_nm` $\leftarrow$ `activities[i].standard_value` (float value of the IC50 in nM)

### 3.3 ClinicalTrials.gov Integration
Retrieves clinical trial statistics and metadata matching the disease condition.

*   **Primary API Base**: `https://clinicaltrials.gov/api/v2`
*   **Endpoint**: `/studies`
    *   **Method**: `GET`
    *   **Parameters**:
        *   `query.cond`: `{disease_name}` (e.g., `"Melanoma"`)
        *   `pageSize`: `10`
        *   `countTotal`: `true`
        *   `fields`: `protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.statusModule.overallStatus`
    *   **Target URL**: `https://clinicaltrials.gov/api/v2/studies?query.cond=Melanoma&pageSize=10&countTotal=true&fields=protocolSection.identificationModule.nctId,protocolSection.identificationModule.briefTitle,protocolSection.statusModule.overallStatus`
    *   **Response Path**:
        *   `trial_count` $\leftarrow$ `totalCount` (e.g., `142`)
        *   `trials` $\leftarrow$ `studies` list:
            *   `nct_id` $\leftarrow$ `studies[i].protocolSection.identificationModule.nctId` (e.g., `"NCT01227889"`)
            *   `title` $\leftarrow$ `studies[i].protocolSection.identificationModule.briefTitle`
            *   `status` $\leftarrow$ `studies[i].protocolSection.statusModule.overallStatus` (e.g., `"COMPLETED"`)

---

## 4. Literature Endpoint Analysis (`/api/literature?query=...`)

The Literature endpoint executes a federated search across **PubMed**, **bioRxiv**, and **OpenAlex** to aggregate recent publication references.

### 4.1 PubMed Integration
*   **Primary API Base**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
*   **Step 1 (Search PMIDs)**: `esearch.fcgi`
    *   **Method**: `GET`
    *   **Parameters**: `db=pubmed&term={query}&retmode=json&retmax=5&sort=relevance`
    *   **Target URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=BRAF+melanoma&retmode=json&retmax=5&sort=relevance`
    *   *Result*: Resolves to list of PMIDs (e.g., `["35113657", "31234568"]`).
*   **Step 2 (Fetch Metadata)**: `efetch.fcgi`
    *   **Method**: `GET`
    *   **Parameters**: `db=pubmed&id={pmids}&retmode=xml` (XML is required for full parsing)
    *   **Target URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=35113657,31234568&retmode=xml`
    *   **Response Path**:
        *   `pubmed` $\leftarrow$ Parse the returned MedlineCitation XML tree:
            *   `pmid` $\leftarrow$ `.//PMID`
            *   `title` $\leftarrow$ `.//ArticleTitle`
            *   `authors` $\leftarrow$ Concatenated string of `.//AuthorList/Author` (formatted as `"LastName Initials"`)
            *   `journal` $\leftarrow$ `.//Journal/Title`
            *   `pub_date` $\leftarrow$ `.//JournalIssue/PubDate/Year` + Month/Day
            *   `abstract` $\leftarrow$ `.//Abstract/AbstractText` (concatenated if structured)
            *   `doi` $\leftarrow$ `.//ArticleIdList/ArticleId[@IdType="doi"]`

### 4.2 bioRxiv/medRxiv Integration
*   **Primary API Base**: `https://api.biorxiv.org/`
*   **Endpoint (DOI Search)**: `details/biorxiv/{doi}` or `details/medrxiv/{doi}`
    *   **Method**: `GET`
    *   **Target URL**: `https://api.biorxiv.org/details/biorxiv/10.1101/2023.08.15.551388`
*   **Endpoint (Date Range Search)**: `details/biorxiv/{start_date}/{end_date}/{cursor}`
    *   **Method**: `GET`
    *   **Target URL**: `https://api.biorxiv.org/details/biorxiv/2024-01-01/2024-01-14/0`
    *   **Response Path**:
        *   `biorxiv` $\leftarrow$ `collection` array filtered locally by query keywords:
            *   `doi` $\leftarrow$ `collection[i].doi`
            *   `title` $\leftarrow$ `collection[i].title`
            *   `authors` $\leftarrow$ `collection[i].authors`
            *   `pub_date` $\leftarrow$ `collection[i].date`
            *   `abstract` $\leftarrow$ `collection[i].abstract`

### 4.3 OpenAlex Integration
*   **Primary API Base**: `https://api.openalex.org`
*   **Endpoint**: `/works`
    *   **Method**: `GET`
    *   **Parameters**: `search={query}&per_page=5`
    *   **Target URL**: `https://api.openalex.org/works?search=BRAF+melanoma&per_page=5`
    *   **Response Path**:
        *   `openalex` $\leftarrow$ `results` array:
            *   `id` $\leftarrow$ `results[i].id` (e.g., `"https://openalex.org/W2741809807"`)
            *   `title` $\leftarrow$ `results[i].title` or `results[i].display_name`
            *   `authors` $\leftarrow$ Join `results[i].authorships.author.display_name` with commas
            *   `pub_date` $\leftarrow$ `results[i].publication_date`
            *   `doi` $\leftarrow$ `results[i].doi`
            *   `abstract` $\leftarrow$ Reconstruct from `results[i].abstract_inverted_index` (see below)

#### Abstract Inverted Index Reconstruction Logic
OpenAlex returns abstracts as an inverted index. The backend service MUST reconstruct the text using this algorithm:
```python
def reconstruct_abstract(inverted_index: dict) -> str:
    if not inverted_index:
        return ""
    # Map words to their position list
    positions = {}
    for word, idxs in inverted_index.items():
        for idx in idxs:
            positions[idx] = word
    # Sort positions and join
    sorted_words = [positions[i] for i in sorted(positions.keys())]
    return " ".join(sorted_words)
```

---

## 5. Recommended Backend Architecture & Service Layout

To achieve clean separation of concerns, the backend should be modularized as follows:

```
backend/app/
├── api/
│   ├── genes.py                 # Resolves /api/genes/{symbol} routing
│   ├── variants.py              # Resolves /api/variants/{variant_id} routing
│   ├── diseases.py              # Resolves /api/diseases/{disease_name} routing
│   └── literature.py            # Resolves /api/literature routing
└── services/
    ├── ensembl_service.py       # Interacts withrest.ensembl.org
    ├── uniprot_service.py       # Interacts with rest.uniprot.org
    ├── opentargets_service.py   # Interacts with api.platform.opentargets.org
    ├── clinvar_service.py       # Interacts with eutils.ncbi.nlm.nih.gov
    ├── gnomad_service.py        # Interacts with gnomad.broadinstitute.org
    ├── gtex_service.py          # Interacts with gtexportal.org
    ├── chembl_service.py        # Interacts with www.ebi.ac.uk/chembl
    ├── clinicaltrials_service.py# Interacts with clinicaltrials.gov
    └── pubmed_service.py        # Interacts with eutils.ncbi.nlm.nih.gov
```

### 5.1 Common Rate Limiting & Transient Fault Handling
All HTTP requests should utilize a unified client wrapper implementing:
1.  **Exponential Backoff**: Retry on `429` and `5xx` status codes.
2.  **Rate-Limiter Constraints**:
    *   NCBI (PubMed, ClinVar): Max 3 requests/sec (10 if API key provided).
    *   Ensembl: Max 15 requests/sec.
    *   gnomAD: Max 10 requests/min (0.16 req/sec).
    *   ChEMBL: Max 5 requests/sec.

---

## 6. Comprehensive Mock Payloads (FastAPI Contracts)

Below are the exact high-fidelity mock JSON payloads that satisfy the frontend interfaces and backend test assertions defined in `PROJECT.md` and `SCOPE.md`.

### 6.1 Gene Endpoint: `/api/genes/{symbol}`
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
        "transcript_id": "ENST00000288602",
        "length": 2446
      }
    ]
  },
  "uniprot": {
    "accession": "P15056",
    "name": "BRAF_HUMAN",
    "sequence": "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALDKFGGEHNPPSIYQDVYELDLLEALDKFGGEHNPPSIYQDVYELDE"
  },
  "opentargets": {
    "target_id": "ENSG00000157764",
    "associations": [
      {
        "disease_id": "EFO_0000616",
        "disease_name": "melanoma",
        "score": 0.95
      },
      {
        "disease_id": "EFO_0000311",
        "disease_name": "colorectal cancer",
        "score": 0.82
      }
    ]
  }
}
```

### 6.2 Variant Endpoint: `/api/variants/{variant_id}`
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
      { "pop": "European", "freq": 0.002 },
      { "pop": "African", "freq": 0.0001 },
      { "pop": "South Asian", "freq": 0.0005 }
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
        "tissue": "Whole Blood",
        "gene_symbol": "BRAF",
        "p_value": 3.4e-6,
        "nes": -0.21
      }
    ]
  }
}
```

### 6.3 Disease Endpoint: `/api/diseases/{disease_name}`
```json
{
  "disease_name": "Melanoma",
  "opentargets": {
    "associated_genes": [
      { "symbol": "BRAF", "score": 0.95 },
      { "symbol": "NRAS", "score": 0.88 },
      { "symbol": "KIT", "score": 0.74 }
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
        "chembl_id": "CHEMBL221959",
        "name": "VEMURAFENIB",
        "ic50_nm": 1.2
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
        "title": "A Study of Vemurafenib in Combination With Cobimetinib in Melanoma Patients",
        "status": "COMPLETED"
      }
    ]
  }
}
```

### 6.4 Literature Endpoint: `/api/literature`
```json
{
  "query": "BRAF melanoma",
  "pubmed": [
    {
      "pmid": "35113657",
      "title": "Targeted Therapy and Immunotherapy in BRAF-mutant Melanoma",
      "authors": "Smith AB, Jones CD",
      "journal": "New England Journal of Medicine",
      "pub_date": "2024 Feb 10",
      "abstract": "BACKGROUND: BRAF mutations are found in 50% of melanomas. METHODS: We evaluated Dabrafenib plus Trametinib therapy. RESULTS: Progression-free survival was significantly improved. CONCLUSION: Dual targeting remains highly effective.",
      "doi": "10.1056/NEJMoa3511365"
    }
  ],
  "biorxiv": [
    {
      "doi": "10.1101/2023.08.15.551388",
      "title": "Single-cell profiling of drug-tolerant persister cells in BRAF-mutated melanoma",
      "authors": "Davis EF, Taylor GH",
      "pub_date": "2023-08-16",
      "abstract": "Melanoma cells acquire resistance to BRAF inhibition through cellular plasticity. We present single-cell RNA transcriptomics tracking these transitions over time."
    }
  ],
  "openalex": [
    {
      "id": "https://openalex.org/W2741809807",
      "title": "Molecular profiling of BRAF inhibitors in melanoma patients",
      "authors": "White LM, Green PH, Miller RJ",
      "pub_date": "2022-11-04",
      "abstract": "We outline the molecular landscape of BRAF mutated melanomas before and during active pharmacological intervention.",
      "doi": "https://doi.org/10.1038/s41586-021-03819-2"
    }
  ]
}
```
