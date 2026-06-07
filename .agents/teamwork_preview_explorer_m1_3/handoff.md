# Handoff Report - Explorer 3

**Status**: Task Complete (Hard Handoff)  
**Role**: Literature Panel Investigator & FastAPI Architect  
**Working Directory**: `c:/Users/gamin/Desktop/github/med/.agents/teamwork_preview_explorer_m1_3/`

---

## 1. Observation

1. **Project Definitions**:
   - `c:\Users\gamin\Desktop\github\med\PROJECT.md` defines the backend architecture as FastAPI (Python) serving endpoints: `/api/genes/{symbol}`, `/api/variants/{variant_id}`, `/api/diseases/{disease_name}`, and `/api/pymol/render` (planned for Milestone 2).
   - `c:/Users/gamin/Desktop/github/med/.agents/sub_orch_m1_backend/SCOPE.md` details `/api/literature?query=...` returning aggregated arrays from PubMed, bioRxiv, and OpenAlex.
2. **External API Constraints**:
   - `C:\Users\gamin\.gemini\config\plugins\science\skills\literature_search_biorxiv\SKILL.md` (lines 33-35) states:
     > `Topic or keywords, no date: **Do NOT use this skill for discovery.** Use a keyword-capable literature skill first to find relevant DOIs, then return here to fetch metadata.`
   - It also warns in lines 37-41:
     > `Do NOT attempt to search broad date ranges (months or years) with --keywords hoping to find a specific paper. The bioRxiv API does not support server-side keyword search. The script must download ALL metadata for the entire date range and filter locally in Python.`
   - `C:\Users\gamin\.gemini\config\plugins\science\skills\literature_search_openalex\SKILL.md` notes that OpenAlex returns abstracts in an inverted index format.
3. **Workspace State**:
   - The root of the workspace `c:\Users\gamin\Desktop\github\med` has no code under `backend/` yet. Layout structure and async querying strategies are recommended from scratch.

---

## 2. Logic Chain

1. **Literature Ingestion**: Since bioRxiv lacks server-side keyword searches and local date filtering is rate-limited, the system must search PubMed and OpenAlex with the query first. By scanning their responses for bioRxiv DOIs (prefix `10.1101`), the backend can make targeted, parallel DOI fetches to bioRxiv to enrich and aggregate official preprint metadata.
2. **Abstract Reconstruction**: Since OpenAlex returns abstracts as inverted indexes, a reconstruction function mapping word keys to position arrays in an instantiated word-list is mathematically required to present clean, readable abstracts in the `openalex` output schema.
3. **FastAPI Client Pooling**: Because the backend orchestrates calls to up to 11 external APIs (Ensembl, UniProt, OpenTargets, ClinVar, gnomAD, GTEx, ChEMBL, ClinicalTrials, PubMed, OpenAlex, bioRxiv), initializing a new client on each request would trigger socket exhaustion. A single shared `httpx.AsyncClient` managed via a lifespan handler solves this.
4. **Concurrency & Fail-Soft**: Since external APIs are prone to rate limits and downtime, executing them sequentially would multiply response times. Running them via `asyncio.gather(..., return_exceptions=True)` enables parallel I/O. Intercepting exceptions per-task and returning empty lists/`None` ensures a robust "fail-soft" endpoint response rather than an HTTP 500 error.
5. **Variant rsID Processing**: Since GTEx single-tissue eQTL lookups require coordinate inputs, but the variant endpoint `/api/variants/{variant_id}` supports rsIDs, the backend must implement a two-stage variant query pipeline. It resolves rsID to coordinate first (Stage 1), and then concurrently fetches GTEx, gnomAD, and ClinVar data (Stage 2).

---

## 3. Caveats

* **Rate Limits**: Heavy usage of E-utilities (PubMed) without an `NCBI_API_KEY` is capped at 3 requests/sec. We assume the system will run with mock endpoints during test verification and require valid API keys in `.env` for production workloads.
* **Preprint Matching**: Merging bioRxiv preprints with peer-reviewed versions in PubMed is suggested via DOI matches; title-based fuzzy matching is excluded from scope to prevent false matches.

---

## 4. Conclusion

The analysis and layout planning are complete. The proposed design features:
1. A modular FastAPI directory layout dividing `api` routers from `services` client wrappers.
2. A two-stage async pipeline for Variant queries.
3. A discovery-based workaround for bioRxiv keyword searches using OpenAlex/PubMed DOI scanning.
4. A fail-soft `asyncio.gather` orchestrator for endpoints.

The complete report has been written to:
`c:/Users/gamin/Desktop/github/med/.agents/teamwork_preview_explorer_m1_3/analysis.md`

---

## 5. Verification Method

To verify the recommendations:
1. **Inspection of Recommended Artifacts**: Read the detailed configurations, Pydantic schemas, and async gathering logic in `c:/Users/gamin/Desktop/github/med/.agents/teamwork_preview_explorer_m1_3/analysis.md`.
2. **Pytest Implementation**: When the implementer builds the service, mock HTTP responses using `pytest-httpx` and verify that `/api/literature` returns a combined JSON payload matching the contract schema in `SCOPE.md`.
3. **Error Failures**: Simulate a 500 Internal Server Error on the OpenAlex client mock, and confirm that `/api/literature` returns a 200 OK with `openalex: []` and populated arrays for `pubmed`.
