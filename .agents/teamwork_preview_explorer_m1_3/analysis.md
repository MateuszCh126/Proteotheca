# Technical Analysis Report: Literature Panel Aggregation & FastAPI Backend Architecture
**Date**: 2026-06-06  
**Milestone**: M1 Backend DB Services & APIs  
**Author**: Explorer 3 (Literature Panel Investigator & FastAPI Architect)

---

## 1. Executive Summary

This report provides a comprehensive architectural recommendation for the BioMed Explorer backend, focusing on data aggregation across biological databases and literature search engines. 

Key recommendations include:
1. **Unified Literature Aggregation**: Design an asynchronous ingestion pipeline querying PubMed, OpenAlex, and bioRxiv/medRxiv in parallel, addressing bioRxiv's lack of server-side keyword search via an OpenAlex DOI-filtering workaround.
2. **Modular FastAPI Structure**: A clean service-router pattern separating API routing logic (`app/api/`) from external client communications (`app/services/`).
3. **Robust Concurrency**: Utilization of `asyncio.gather(..., return_exceptions=True)` to execute queries in parallel, preventing single-point-of-failure blocks via a graceful "fail-soft" degradation pattern.
4. **rsID-to-Coordinate Pipeline**: A two-stage variant query pipeline that resolves rsIDs to chromosomal positions before concurrently fetching ClinVar, gnomAD, and GTEx data.

---

## 2. Analysis of Data Sources & APIs per Entity

Each portal search option relies on specific external services. The table below maps these interfaces:

| Entity | Target Source | Primary API Method / Endpoint | Critical Parameters | Key Data Fields Extracted |
|---|---|---|---|---|
| **Gene Symbol** | **Ensembl** | REST GET: `/lookup/symbol/homo_sapiens/{symbol}` | `expand=1` (fetches transcripts in one call) | `id` (ENSG ID), `DisplayName`, `Transcript` list (IDs and lengths) |
| | **UniProt** | REST GET: `/uniprotkb/search` | `query=gene:{symbol}+AND+organism_id:9606`, `format=json` | `primaryAccession`, `uniProtkbId`, `sequence.value` |
| | **OpenTargets** | GraphQL POST: `/api/v4/graphql` | Target Query using Ensembl Gene ID | Associated diseases list, disease names, association scores |
| **Genetic Variant** | **ClinVar** | Entrez E-utilities: ESearch + ESummary on `clinvar` | `term={rsid}`, `db=clinvar` | `germline_classification` (pathogenicity), clinical significance, review status |
| | **gnomAD** | GraphQL POST: `/api` | Variant Query using rsID or coordinates | Genome/Exome allele frequencies, homozygote counts, ancestral populations |
| | **GTEx** | REST GET: `/association/singleTissueEqtl` | `gencodeId={gencode_id}`, `variantId={variant_id}` | `tissueSiteDetailId` (tissue name), `pValue`, `nes` (normalized effect size), `geneSymbol` |
| **Disease / Indication** | **OpenTargets** | GraphQL POST: `/api/v4/graphql` | Disease Query using EFO ID or disease name | Top associated genes, association scores |
| | **ChEMBL** | REST GET: `/activity.json` | `target_chembl_id={target_id}`, `standard_type=IC50` | `chembl_id`, active compounds, `standard_value` (IC50 value in nM) |
| | **ClinicalTrials** | REST GET (APIv2): `/studies` | `query.cond={disease_name}`, `pageSize=10` | `nctId`, `officialTitle`, `overallStatus` (e.g. RECRUITING, COMPLETED) |
| **Literature** | **PubMed** | E-utilities: ESearch + ESummary/EFetch | `db=pubmed`, `term={query}` | `pmid`, `title`, `authors`, `source` (journal), `pubdate`, `abstract`, `doi` |
| | **OpenAlex** | REST GET: `/works` | `search={query}`, `per_page=10` | `id`, `title`, `authorships` (author names), `publication_date`, `abstract_inverted_index`, `doi` |
| | **bioRxiv / medRxiv** | REST GET: `/details/{server}/{doi}` | `doi={doi}` (resolved from OpenAlex/PubMed) | `doi`, `title`, `authors`, `date`, `abstract`, `server` |

---

## 3. Deep Dive: Literature Panel Aggregation

### 3.1. The bioRxiv Keyword Search Challenge & Workaround
**The Problem**: The bioRxiv/medRxiv API does not support server-side keyword searching. It only supports retrieval by date range (which is too slow and hits rate limits for general searches) or by specific DOI.  
**The Solution**: Treat OpenAlex and PubMed as "discovery engines" for bioRxiv preprints.
1. Query OpenAlex using the keyword search, applying a filter for preprints published on bioRxiv/medRxiv (using host venue filters or checking if the DOI prefix is `10.1101`).
2. Extract the list of preprints and their DOIs.
3. Concurrently query `https://api.biorxiv.org/details/biorxiv/{doi}` (or `medrxiv`) using the collected DOIs to retrieve the official metadata and abstracts from the source.

### 3.2. OpenAlex Inverted Index Abstract Reconstruction
OpenAlex returns abstracts in an inverted index format to comply with copyright restrictions. The backend must reconstruct the abstract. Below is the proposed Python implementation for `app/services/openalex_service.py`:

```python
def reconstruct_abstract(inverted_index: dict[str, list[int]] | None) -> str:
    """Reconstructs the full-text abstract from the OpenAlex inverted index."""
    if not inverted_index:
        return ""
    try:
        # Each word maps to its 0-indexed positions in the text
        max_pos = max(pos for positions in inverted_index.values() for pos in positions)
        words = [""] * (max_pos + 1)
        for word, positions in inverted_index.items():
            for pos in positions:
                words[pos] = word
        return " ".join(words)
    except Exception:
        return ""
```

### 3.3. Literature Aggregation & Deduplication Logic
When merging results into the `/api/literature` schema, the backend must apply normalization and deduplication to ensure response cleanliness:
* **Author Normalization**: Standardize author lists from all three sources into a consistent comma-separated string (e.g., `"Smith J, Doe J"`).
* **Date Normalization**: Standardize dates to ISO YYYY-MM-DD.
* **Preprint-to-Journal De-duplication**: If a preprint exists in bioRxiv and its peer-reviewed version exists in PubMed, they should be cross-linked or filtered depending on relevance. For simplicity, we de-duplicate by `doi` within each repository block.
* **bioRxiv Version Deduplication**: bioRxiv returns multiple entries for version updates (v1, v2, etc.) of a single preprint. The service must filter these, keeping only the latest version based on the `date` field.

---

## 4. FastAPI Project Layout & Router Configurations

### 4.1. Directory Structure
We recommend the following modular layout, conforming to the interface contracts defined in `PROJECT.md` and `SCOPE.md`:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application initialization and routing hooks
│   ├── config.py            # Configuration & environment settings (Pydantic BaseSettings)
│   ├── api/                 # Endpoint routers (routers handle request validations and orchestrate services)
│   │   ├── __init__.py
│   │   ├── dependencies.py  # Dependency injection helpers (e.g., get_http_client)
│   │   ├── genes.py         # /api/genes/{symbol}
│   │   ├── variants.py      # /api/variants/{variant_id}
│   │   ├── diseases.py      # /api/diseases/{disease_name}
│   │   └── literature.py    # /api/literature?query=...
│   └── services/            # Low-level service client wrappers
│       ├── __init__.py
│       ├── base_client.py   # Base client with retries/rate-limiting/timeout wrapper
│       ├── ensembl_service.py
│       ├── uniprot_service.py
│       ├── opentargets_service.py
│       ├── clinvar_service.py
│       ├── gnomad_service.py
│       ├── gtex_service.py
│       ├── chembl_service.py
│       ├── clinicaltrials_service.py
│       ├── pubmed_service.py
│       ├── openalex_service.py
│       └── biorxiv_service.py
├── tests/                   # Pytest verification suite (uses pytest-asyncio & httpx mocking)
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_genes.py
│   ├── test_variants.py
│   ├── test_diseases.py
│   └── test_literature.py
├── requirements.txt
└── run.py                   # Development script to boot Uvicorn
```

### 4.2. Configuration Management (`app/config.py`)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Base Application Configurations
    APP_NAME: str = "BioMed Explorer Portal API"
    DEBUG: bool = False
    PORT: int = 8000
    
    # Credentials & API Keys
    NCBI_API_KEY: str | None = None
    USER_EMAIL: str | None = None
    OPENALEX_API_KEY: str | None = None
    
    # Base URLs for Service Integration
    ENSEMBL_BASE_URL: str = "https://rest.ensembl.org"
    UNIPROT_BASE_URL: str = "https://rest.uniprot.org"
    OPENTARGETS_BASE_URL: str = "https://api.platform.opentargets.org/api/v4/graphql"
    GNOMAD_BASE_URL: str = "https://gnomad.broadinstitute.org/api"
    GTEX_BASE_URL: str = "https://gtexportal.org/api/v2"
    CHEMBL_BASE_URL: str = "https://www.ebi.ac.uk/chembl/api/data"
    CLINICALTRIALS_BASE_URL: str = "https://clinicaltrials.gov/api/v2"
    NCBI_EUTILS_BASE_URL: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    OPENALEX_BASE_URL: str = "https://api.openalex.org"
    BIORXIV_BASE_URL: str = "https://api.biorxiv.org"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
```

### 4.3. Shared HTTPX Client via Lifespan (`app/main.py`)
To prevent socket exhaustion and utilize connection pooling, we spin up a global `httpx.AsyncClient` inside the FastAPI lifespan context:

```python
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.api import genes, variants, diseases, literature

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create a pooled AsyncClient session
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
    app.state.http_client = httpx.AsyncClient(limits=limits, timeout=15.0)
    yield
    # Shutdown: Close connection pool
    await app.state.http_client.aclose()

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route mounting
app.include_router(genes.router, prefix="/api")
app.include_router(variants.router, prefix="/api")
app.include_router(diseases.router, prefix="/api")
app.include_router(literature.router, prefix="/api")
```

---

## 5. Async Execution & Parallel Querying Strategies

### 5.1. Concurrency Model: Why Asyncio?
External API querying is highly I/O-bound. Blocking synchronous HTTP queries (like `requests`) would block the event loop, causing requests to queue up and leading to high latency. By utilizing `async/await` and `httpx.AsyncClient`, FastAPI can handle other requests while waiting for external database responses.

### 5.2. Parallel Querying with `asyncio.gather` and Graceful Failures
When querying multiple services for a single endpoint (e.g., Ensembl, UniProt, and OpenTargets), a failure in one service should not crash the entire endpoint. We distinguish between **Critical Dependencies** (which must succeed) and **Non-Critical Dependencies** (which can fail-soft to empty responses):

1. **Critical vs Non-Critical Routing**:
   * **Genes Endpoint**: Ensembl is *Critical* (supplies the ID needed for other services). UniProt and OpenTargets are *Non-Critical*.
   * **Variants Endpoint**: ClinVar, gnomAD, and GTEx are all *Non-Critical* (meaning the endpoint will still return coordinates and metadata even if population frequencies fail).
   * **Diseases Endpoint**: OpenTargets, ChEMBL, and ClinicalTrials are all *Non-Critical*.
   * **Literature Endpoint**: PubMed, OpenAlex, and bioRxiv are all *Non-Critical*.
   
2. **Implementation Example (Fail-Soft Parallel Orchestration)**:
   Below is the proposed design for the `/api/literature` endpoint demonstrating the parallel fail-soft querying strategy:

```python
import logging
import asyncio
from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_http_client
from app.services.pubmed_service import PubmedService
from app.services.openalex_service import OpenAlexService
from app.services.biorxiv_service import BiorxivService
from pydantic import BaseModel, Field

logger = logging.getLogger("api.literature")
router = APIRouter()

# Unified Literature Schema (as specified in SCOPE.md)
class PubMedArticle(BaseModel):
    pmid: str
    title: str
    authors: str
    journal: str
    pub_date: str
    abstract: str
    doi: str | None = None

class BioRxivPreprint(BaseModel):
    doi: str
    title: str
    authors: str
    pub_date: str
    abstract: str

class OpenAlexWork(BaseModel):
    id: str
    title: str
    authors: str
    pub_date: str
    abstract: str
    doi: str | None = None

class LiteratureResponse(BaseModel):
    query: str
    pubmed: list[PubMedArticle] = Field(default_factory=list)
    biorxiv: list[BioRxivPreprint] = Field(default_factory=list)
    openalex: list[OpenAlexWork] = Field(default_factory=list)

@router.get("/literature", response_model=LiteratureResponse)
async def get_literature(
    query: str = Query(..., description="Query string for search"),
    client = Depends(get_http_client)
):
    pubmed_service = PubmedService(client)
    openalex_service = OpenAlexService(client)
    biorxiv_service = BiorxivService(client)
    
    # We query PubMed and OpenAlex concurrently first
    # This also allows us to extract bioRxiv DOIs from OpenAlex/PubMed
    tasks = [
        pubmed_service.search_and_fetch(query),
        openalex_service.search_works(query)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    pubmed_data = []
    openalex_data = []
    
    # Process PubMed results
    if isinstance(results[0], Exception):
        logger.error(f"PubMed search failed: {results[0]}")
    else:
        pubmed_data = results[0]
        
    # Process OpenAlex results
    if isinstance(results[1], Exception):
        logger.error(f"OpenAlex search failed: {results[1]}")
    else:
        openalex_data = results[1]
        
    # Discover bioRxiv DOIs to hit bioRxiv's DOI lookup endpoint
    biorxiv_dois = set()
    
    # Workaround: Identify papers originating from bioRxiv/medRxiv
    for work in openalex_data:
        # Check DOI prefix or source details for bioRxiv/medRxiv
        if work.get("doi") and "10.1101" in work["doi"]:
            biorxiv_dois.add(work["doi"])
            
    for paper in pubmed_data:
        if paper.get("doi") and "10.1101" in paper["doi"]:
            biorxiv_dois.add(paper["doi"])
            
    # Fetch bioRxiv details concurrently for all discovered DOIs
    biorxiv_data = []
    if biorxiv_dois:
        biorxiv_tasks = [
            biorxiv_service.fetch_by_doi(doi) for doi in list(biorxiv_dois)[:10]  # Cap at 10 to protect rates
        ]
        biorxiv_results = await asyncio.gather(*biorxiv_tasks, return_exceptions=True)
        for res in biorxiv_results:
            if isinstance(res, Exception):
                logger.warning(f"bioRxiv single DOI fetch failed: {res}")
            elif res:
                biorxiv_data.append(res)
                
    return LiteratureResponse(
        query=query,
        pubmed=pubmed_data,
        biorxiv=biorxiv_data,
        openalex=openalex_data
    )
```

### 5.3. Variant Endpoint Pipeline Special Case (Two-Stage Querying)
When querying the `/api/variants/{variant_id}` endpoint:
1. **If user enters chromosomal coordinates** (e.g., `7:140753336:A:T`): 
   All services (ClinVar, gnomAD, GTEx) can be queried in parallel instantly.
2. **If user enters an rsID** (e.g., `rs113488022`):
   * GTEx single-tissue eQTL lookup requires a chromosomal coordinate input.
   * ClinVar and gnomAD can accept rsID directly.
   * **Pipeline Recommendation**: 
     - **Stage 1 (Coordinate Resolution)**: Call ClinVar or dbSNP to resolve the rsID to chromosomal coordinate.
     - **Stage 2 (Concurrent Query)**: Once coordinates are resolved, trigger parallel queries to GTEx (using coordinates) and gnomAD (using rsID/coordinates) and complete ClinVar retrieval.
