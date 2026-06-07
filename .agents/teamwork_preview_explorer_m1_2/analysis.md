# Variant Representation, Database Integration, and Resilient API Architecture Report

## Executive Summary
This report provides a comprehensive analysis and architectural recommendation for the database aggregation services of the **BioMed Explorer Portal** (Milestone 1 Backend). It focuses on standardizing entities, parsing and mapping genetic variants (specifically handling `rsID` vs. `chr:pos:ref>alt` formats across ClinVar, gnomAD, and GTEx), mapping disease indications, and aggregating literature from parallel sources. Additionally, it defines concrete, production-ready patterns for rate limiting, caching, and error handling.

---

## 1. Gene Symbol Resolution and Mapping
Genes are the primary search entry points. Since databases use distinct identifier schemes, we must map user-supplied gene symbols to canonical database-specific keys.

### 1.1 Target Databases & Identifiers
*   **Ensembl**: Standardizes on Stable Gene IDs (`ENSG` format, e.g., `ENSG00000157764`).
*   **UniProtKB**: Standardizes on accession numbers (e.g., `P15056`) and entry names (e.g., `BRAF_HUMAN`).
*   **OpenTargets Platform**: Standardizes on Ensembl Gene IDs (`ENSG` format) to map targets to diseases.

### 1.2 Endpoint & Splicing Isoform Handling
*   **Ensembl Resolution**: Resolves a gene symbol using `GET /lookup/symbol/homo_sapiens/{symbol}`. Ensembl supports synonym resolution natively if the primary symbol fails.
*   **Isoform Priority**: Genes contain multiple transcripts (splicing isoforms). For human genes, the backend must default to the **MANE Select** transcript (`is_mane_select = true`), which represents a 100% match between Ensembl and NCBI RefSeq. If MANE Select is not available (or for non-human species), fallback to the **Ensembl Canonical transcript** (`is_canonical = true`).
*   **Transcript Support Level (TSL)**: When displaying alternative isoforms, sort by TSL (TSL 1 being high confidence, TSL 5 being low confidence).

### 1.3 Resolution Pipeline
```
[User Input: "BRAF"] 
       │
       ▼
[Ensembl: GET /lookup/symbol/homo_sapiens/BRAF?expand=1]
       │
       ├──► ENSG ID ("ENSG00000157764") ──► Query OpenTargets Platform GraphQL API
       │
       ├──► MANE Select Transcript ID ("ENST00000644969") 
       │
       └──► Cross-References (DBLinks) 
                │
                └──► UniProt Accession ("P15056") ──► Query UniProtKB REST API
```

---

## 2. Genetic Variant Representation, Parsing, and Mapping
Genetic variants are represented as either unique rsIDs or chromosomal coordinates. To query ClinVar, gnomAD, and GTEx, the backend must parse, normalize, and map between these formats.

### 2.1 Coordinate Formats Across Databases
*   **dbSNP**: Uses RefSNP ID (`rsID`, e.g., `rs113488022`) or genomic placement (Chromosome, Position, Ref, Alt).
*   **ClinVar**: Uses ClinVar Variation IDs (numeric, e.g., `12345`) or dbSNP rsID. ClinVar allows coordinate search via Entrez queries: `{chrom}[chr] AND {start}:{end}[chrpos]`.
*   **gnomAD**: Uses Variant ID format `chrom-pos-ref-alt` (e.g., `7-140753336-A-T`) or rsID.
*   **GTEx**: Uses Variant ID format `chr{chrom}_{pos}_{ref}_{alt}_b38` (e.g., `chr7_140753336_A_T_b38`). GTEx standardizes entirely on **GRCh38** positions.

### 2.2 Parsing and Normalization Logic
The backend must parse user-supplied variant IDs into structured coordinate tuples. User input can be an rsID or coordinates separated by colons, hyphens, underscores, or slash/greater-than signs.

#### Regular Expressions for Normalization
```python
import re
from typing import Dict, Any, Optional

# Match rsID (case-insensitive, optional 'rs' prefix)
RSID_PATTERN = re.compile(r"^rs?(\d+)$", re.IGNORECASE)

# Match coordinates: "chr7:140753336:A>T", "7_140753336_A_T", "chrX-12345-C-G"
COORD_PATTERN = re.compile(
    r"^(?:chr)?([1-9]|1[0-9]|2[0-2]|[XYM])"    # Chromosome (1-22, X, Y, M)
    r"[:\-_]"                                  # First separator
    r"(\d+)"                                   # 1-based position
    r"[:\-_]"                                  # Second separator
    r"([ACGTN]+)"                              # Ref allele
    r"(?:>|/|[:\-_])"                          # Third separator (handles A>T, A/T, A:T, A_T)
    r"([ACGTN]+)$",                            # Alt allele
    re.IGNORECASE
)

def parse_variant_input(user_input: str) -> Dict[str, Any]:
    """
    Parses and normalizes a variant input string.
    Returns a dictionary indicating the type and parsed components.
    """
    user_input = user_input.strip()
    
    rsid_match = RSID_PATTERN.match(user_input)
    if rsid_match:
        return {
            "type": "rsid",
            "normalized": f"rs{rsid_match.group(1)}",
            "value": rsid_match.group(1)
        }
        
    coord_match = COORD_PATTERN.match(user_input)
    if coord_match:
        chrom = coord_match.group(1).upper()
        pos = int(coord_match.group(2))
        ref = coord_match.group(3).upper()
        alt = coord_match.group(4).upper()
        
        # dbSNP-specific chromosome mapping (X -> 23, Y -> 24)
        dbsnp_chrom = chrom
        if chrom == "X":
            dbsnp_chrom = "23"
        elif chrom == "Y":
            dbsnp_chrom = "24"
            
        return {
            "type": "coordinates",
            "normalized": f"chr{chrom}:{pos}:{ref}>{alt}",
            "chrom": chrom,
            "dbsnp_chrom": dbsnp_chrom,
            "pos": pos,
            "ref": ref,
            "alt": alt
        }
        
    raise ValueError(f"Invalid variant format: {user_input}")
```

### 2.3 Reference Assembly & Assembly Liftover
Coordinates are assembly-specific. The portal standardizes on **GRCh38**.
If coordinates are queried on **GRCh37**, the backend must map them to GRCh38 using the **Ensembl Coordinate Mapping (Liftover) API**:
*   **Ensembl Liftover Endpoint**: `GET /map/human/GRCh37/{chrom}:{start}-{end}/{target_assembly}`
*   **API Syntax**:
    ```http
    GET https://rest.ensembl.org/map/human/GRCh37/7:140453136-140453136:1/GRCh38?content-type=application/json
    ```
    This returns the corresponding coordinate on GRCh38 (`140753336`).

### 2.4 Unified Coordinate Mapping Workflow
When a variant is searched, the backend must resolve both the coordinates and the rsID to ensure all downstream database clients (ClinVar, gnomAD, GTEx) can be queried.

```
                  ┌───────────────────────────────┐
                  │      User Variant Search      │
                  └──────────────┬────────────────┘
                                 │
                        [parse_variant_input]
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
               [Type: rsID]          [Type: Coordinates]
                     │                       │
           [dbSNP: resolve-rsid]    [dbSNP: resolve-variant]
                     │                       │
                     ▼                       ▼
            Merged Variant Record: { rsid, chrom, pos, ref, alt }
                     │
                     ├───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
           Construct ClinVar Query   Construct gnomAD ID     Construct GTEx ID
           (rsID or chrpos search)   (chrom-pos-ref-alt)     (chr_pos_ref_alt_b38)
```

---

## 3. Disease/Indication Mapping
Indication mapping links disease entities to genes (targets), active compounds (ChEMBL), and ongoing research studies (ClinicalTrials.gov).

### 3.1 Identifier Systems
*   **OpenTargets**: Uses Experimental Factor Ontology (**EFO**) IDs (e.g., `EFO_0000616` for melanoma). EFO IDs are resolved using OpenTargets' search GraphQL query.
*   **ChEMBL**: Uses internal ChEMBL IDs (e.g., `CHEMBL2103830` for dabrafenib). Targets can be mapped by searching for proteins containing a specific UniProt accession.
*   **ClinicalTrials.gov**: Standardizes on Medical Subject Headings (**MeSH**) terms, but allows direct text searching on conditions (e.g., `--condition "melanoma"`).

### 3.2 Indication Resolution Pipeline
```
[User Input: "Melanoma"]
       │
       ├─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
 [OpenTargets: search-disease]    [ChEMBL: search indications]     [ClinicalTrials.gov: search]
       │                                 │                                 │
    EFO ID ("EFO_0000616")        Molecules (ChEMBL IDs)            NCT IDs of studies
       │                                 │
       ▼                                 ▼
Query associated genes         Query drug mechanisms
and clinical scores            & standardized IC50/Ki values
```

---

## 4. Literature Panel Aggregation
The literature panel `/api/literature?query=...` aggregates publication data across PubMed, bioRxiv/medRxiv, and OpenAlex.

### 4.1 External APIs and Query Structures
*   **PubMed**: Use NCBI Entrez E-search (`search_pubmed` command) to find PMIDs, followed by E-summary (`fetch_article_abstracts`) to fetch metadata and abstracts.
*   **OpenAlex**: Use filter works (`--search`) to find works matching the query, sorted by citation counts (`--sort cited_by_count:desc`).
*   **bioRxiv/medRxiv**:
    *   *Constraint*: The bioRxiv API does not support server-side keyword searches. Requesting broad date ranges to filter locally causes timeouts and IP blocking.
    *   *Optimized Aggregation Strategy*:
        1.  **Extract DOIs from PubMed & OpenAlex results**: Examine the DOIs returned by PubMed and OpenAlex. If any DOI matches the bioRxiv pattern (starts with `10.1101/`), resolve the preprint metadata directly via `search_by_doi.py` (which is highly optimized).
        2.  **Fallback date-restricted search**: If no bioRxiv DOIs are found, perform a date-based search (`search_by_dates.py`) restricted to the last **14 to 30 days** and filtered by a relevant subject category (e.g., `cancer_biology` or `genetics`) to minimize download sizes, filtering keywords locally.

---

## 5. Resilient Architecture Recommendations
To ensure high reliability, the backend must be insulated from external API rate limits, slow network performance, and service downtime.

### 5.1 Robust Fallback Mechanisms
*   **Graceful Degradation (Partial Responses)**: If an external database (e.g., GTEx) is down, the API must not return HTTP 500. It should return a `200 OK` response containing the successfully retrieved data, alongside a structured `metadata.warnings` or `errors` array indicating which endpoints failed.
*   **API Schema for Partial Responses**:
    ```json
    {
      "symbol": "BRAF",
      "ensembl": { "gene_id": "ENSG00000157764" },
      "uniprot": { "accession": "P15056" },
      "opentargets": null,
      "metadata": {
        "status": "partial_success",
        "errors": [
          {
            "source": "opentargets",
            "message": "GraphQL endpoint returned 503 Service Unavailable"
          }
        ]
      }
    }
    ```

### 5.2 Rate Limiting Handlers
*   **NCBI Services**: Strictly limit traffic to **3 requests per second** (without key) or **10 requests per second** (with key).
*   **Ensembl Services**: Strictly limit traffic to **15 requests per second**.
*   **Concurrency Semaphores**: Use `asyncio.Semaphore` in FastAPI service layers to cap parallel connections.
*   **Retry with Exponential Backoff**: Wrap all external HTTP clients using the `tenacity` library to retry on transient HTTP codes (429, 502, 503, 504) with randomized exponential jitter.

#### Code Snippet: Resilient Async Client Wrapper
```python
import asyncio
import httpx
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

class ResilientApiClient:
    def __init__(self, base_url: str, rate_limit: int, timeout: float = 10.0):
        self.client = httpx.AsyncClient(base_url=base_url, timeout=timeout)
        self.semaphore = asyncio.Semaphore(rate_limit)

    @retry(
        stop=stop_after_attempt(4),
        wait=wait_random_exponential(multiplier=1, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.RequestError)),
        reraise=True
    )
    async def get_with_rate_limit(self, path: str, params: Optional[dict] = None) -> dict:
        async with self.semaphore:
            # Add a small delay to guarantee spacing under the rate limit
            await asyncio.sleep(1.0 / self.semaphore._value if self.semaphore._value > 0 else 0.1)
            response = await self.client.get(path, params=params)
            response.raise_for_status()
            return response.json()
```

### 5.3 Caching Structures
Biological data (gene coordinates, variant placements) is highly static. Literature changes daily. Caching is critical to avoid API rate limits and reduce latency.

*   **Multi-Tier Caching**:
    *   **L1 (In-Memory)**: A localized TTL cache (e.g., `cachetools` in python) for high-frequency queries (popular genes like *EGFR*, *BRAF*).
    *   **L2 (Distributed Key-Value Store)**: **Redis** (or a local SQLite store in container environments) for storing parsed JSON API payloads.
*   **Cache TTL Guidelines**:
    *   *Coordinates & Mappings (Ensembl, dbSNP)*: 7 Days (Rarely changes).
    *   *Pathogenicity & Frequencies (ClinVar, gnomAD)*: 3 Days.
    *   *Expression Data (GTEx)*: 7 Days.
    *   *Literature Panels (PubMed, bioRxiv)*: 12 Hours.
*   **Stale-While-Revalidate Pattern**: If a cache entry is stale, return the cached value immediately to the user, and spawn a background task (e.g., `asyncio.create_task`) to fetch the fresh data from the external API and update the cache. This guarantees sub-millisecond response times for cached items.

#### Code Snippet: Stale-While-Revalidate Implementation
```python
import time
from typing import Callable, Any

class RedisSWRChache:
    def __init__(self, redis_client, default_ttl: int = 86400, grace_period: int = 43200):
        self.redis = redis_client
        self.ttl = default_ttl
        self.grace_period = grace_period

    async def get_or_fetch(self, key: str, fetch_coro: Callable[[], Any]) -> Any:
        cached = await self.redis.get(key)
        now = time.time()
        
        if cached:
            data = json.loads(cached)
            fetched_time = data["timestamp"]
            
            # Check if it has expired but is within the grace period
            if now - fetched_time < self.ttl:
                return data["payload"]
            elif now - fetched_time < (self.ttl + self.grace_period):
                # Trigger async revalidation in the background
                asyncio.create_task(self._revalidate(key, fetch_coro))
                return data["payload"] # Serve stale data
                
        # Cache miss or complete expiration
        payload = await fetch_coro()
        await self.set_cache(key, payload)
        return payload

    async def set_cache(self, key: str, payload: Any):
        data = {
            "timestamp": time.time(),
            "payload": payload
        }
        await self.redis.set(key, json.dumps(data))

    async def _revalidate(self, key: str, fetch_coro: Callable[[], Any]):
        try:
            payload = await fetch_coro()
            await self.set_cache(key, payload)
        except Exception:
            # Silently catch revalidation failures to avoid interrupting users
            pass
```
