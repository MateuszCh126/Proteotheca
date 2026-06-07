# Handoff Report — Explorer 2 (Milestone 1 Backend)

## 1. Observation
- **Workspace Directories**: The workspace root is `c:\Users\gamin\Desktop\github\med\`. A listing of the root directory confirms the project structure is currently in its initial planning state, with no `backend/` directory or python source code files generated yet.
  - Verbatim directory listing of `c:\Users\gamin\Desktop\github\med\`:
    ```json
    {"name":".agents", "isDir":true}
    {"name":"ORIGINAL_REQUEST.md", "sizeBytes":"3909"}
    {"name":"PROJECT.md", "sizeBytes":"5788"}
    {"name":"TEST_INFRA.md", "sizeBytes":"2181"}
    ```
- **Project Specifications**:
  - `PROJECT.md` defines the backend endpoints:
    - `/api/genes/{symbol}`
    - `/api/variants/{variant_id}` (Accepts rsID or `chr:pos:ref>alt` format)
    - `/api/diseases/{disease_name}`
  - `.agents/sub_orch_m1_backend/SCOPE.md` defines:
    - `/api/literature` (aggregates PubMed, bioRxiv, OpenAlex)
- **External Database Integration Mappings**:
  - ClinVar: Can be searched by Variation IDs, rsID, or chromosomal region.
  - gnomAD: Variant frequency API takes `chrom-pos-ref-alt` or rsID.
  - GTEx: eQTL query takes `chr{chrom}_{pos}_{ref}_{alt}_b38` (GRCh38 assembly).
  - dbSNP: Command list inside `dbsnp-database/SKILL.md` documents `resolve-variant`, `resolve-rsid`, and `resolve-hgvs` workflows, showing that chromosomes X/Y map to 23/24 for dbSNP Variation Services CLI.
  - bioRxiv: `literature-search-biorxiv/SKILL.md` states: *"The bioRxiv API does not support server-side keyword search. The script must download ALL metadata for the entire date range and filter locally in Python. Broad ranges will result in thousands of API calls, timeouts..."*

## 2. Logic Chain
1. **Variant Parsing**: Because `PROJECT.md` specifies that the `/api/variants/{variant_id}` endpoint accepts both `rsID` (e.g. `rs113488022`) and chromosomal coordinates (e.g. `chr7:140753336:A>T`), the backend must normalize inputs using regular expressions.
2. **Unified Variant Keys**: Since downstream databases require either rsIDs (ClinVar, gnomAD) or coordinates formatted in a database-specific way (gnomAD: `7-140753336-A-T`; GTEx: `chr7_140753336_A_T_b38`), the resolution service must query dbSNP to obtain a unified mapping record `{ rsid, chrom, pos, ref, alt }` from any format.
3. **Assembly Alignment**: GTEx is restricted to GRCh38 coordinates. If a user queries coordinates matching GRCh37, we must map them using Ensembl's REST API `/map/human/GRCh37/.../GRCh38` endpoint.
4. **Resilience and Performance**: Because biological coordinates do not change and literature databases have restrictive rate limits (e.g., NCBI 3 req/s without key), the backend must enforce rate limits via `asyncio.Semaphore`, use `tenacity` for exponential backoffs, and apply Redis-based stale-while-revalidate caching to eliminate downstream latency.

## 3. Caveats
- Investigated only public, standard biological database API schemas as documented in the agent skills and standard REST/GraphQL reference materials. Actual network conditions or API key configurations (such as `NCBI_API_KEY`) will dictate real-world request limits.
- Assumed standard GRCh38 coordinates are the canonical target reference for all cross-database alignments (which is typical for modern clinical data pipelines).

## 4. Conclusion
- The backend variant integration layer should be structured around a **Unified Variant Resolution Service** that parses inputs using regular expressions and resolves mappings via dbSNP.
- The service must format output strings to match gnomAD and GTEx identifiers, liftover GRCh37 to GRCh38 if needed, and gracefully handle database timeouts/failures using FastAPI partial response formats (`200 OK` with an `errors` metadata block) instead of throwing HTTP 500.

## 5. Verification Method
- **Analysis File Inspection**: The comprehensive analysis report is written to:
  `c:/Users/gamin/Desktop/github/med/.agents/teamwork_preview_explorer_m1_2/analysis.md`
  Verify that the file contains the following key sections:
  1. Regular expression validation pattern for variant formats.
  2. Liftover mapping logic via Ensembl.
  3. Concrete Python/FastAPI code snippets for `ResilientApiClient` (using `tenacity` and `asyncio.Semaphore`) and `RedisSWRChache` (stale-while-revalidate caching).
- **Validation**: Verify that these files conform to project layouts. No source code or tests have been created inside `.agents/` directory, conforming to Workspace Conventions.
