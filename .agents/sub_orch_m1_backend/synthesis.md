# Synthesis Report: Milestone 1 Backend Database Services & APIs

## Consensus
All three Explorer agents agree on the core backend design principles:
1. **Directory Layout**: Conforms to `PROJECT.md` using a service-router separation:
   - `backend/app/api/` for endpoints
   - `backend/app/services/` for DB clients
   - `backend/tests/` for verification tests.
2. **Unified Variant Mapping**: A two-stage pipeline for `/api/variants/{variant_id}`:
   - Stage 1: Parse input (rsID or coordinates) using regular expressions. If rsID, query dbSNP or Ensembl to resolve coordinate components (`chrom`, `pos`, `ref`, `alt`).
   - Stage 2: Concurrently query gnomAD, GTEx, and ClinVar using the normalized variant identifiers.
3. **Literature Discovery Pattern**:
   - bioRxiv lacks keyword search capability.
   - The solution is to search PubMed and OpenAlex with the keywords first, scan the results for bioRxiv DOIs (prefix `10.1101`), and then retrieve preprint metadata from bioRxiv concurrently using those DOIs.
4. **Abstract Reconstruction**:
   - Reconstruct OpenAlex abstracts from the `abstract_inverted_index` by mapping words to their coordinate positions.
5. **Fail-Soft Concurrency**:
   - Utilize `asyncio.gather(..., return_exceptions=True)` to run external requests concurrently.
   - Return partial data with warnings/errors rather than throwing 500 when external endpoints fail or are throttled.

## Resolved Conflicts
No conflicts identified. Explorer findings were highly complementary:
- Explorer 1 mapped the specific external endpoints and mock JSON structures.
- Explorer 2 detailed variant parsing regular expressions, coordinate liftover, tenacity retries, and stale-while-revalidate caching.
- Explorer 3 detailed literature aggregation and the FastAPI event loop client lifespans.

## Gaps
None. The specifications cover all 12 external resources and meet all requirements.
