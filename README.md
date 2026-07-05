# BioMed Explorer — Proteotheca

> A research-grade web portal that unifies **30+ biological and medical databases** behind a single
> interface, with an in-browser **3D protein viewer**, protein-interaction networks, variant
> frequency charts and full user authentication. Built to solve the fragmentation problem in
> biomedical research: instead of visiting Ensembl, UniProt, gnomAD, ClinVar, AlphaFold, PDB,
> OpenTargets and PubMed separately, a researcher explores one gene, variant and disease in one place.

**Stack:** FastAPI (Python, async) · React 18 + TypeScript + Vite · Mol\* (WebGL) · SQLAlchemy (async) · JWT

---

## What it does

Enter a gene (e.g. `BRAF`), a variant (`rs113488022`) and a disease (`Melanoma`), and the portal
aggregates data from dozens of sources into a single clinical-style dashboard:

- **3D protein structures** — AlphaFold and PDB rendered directly in the browser with Mol\*
- **Genomics** — Ensembl transcripts, gnomAD allele frequencies, ClinVar pathogenicity, dbSNP
- **Pathways & targets** — Reactome, OpenTargets disease associations
- **Literature** — PubMed, bioRxiv, EuropePMC, arXiv, OpenAlex
- **Pharmacology** — ChEMBL compounds, openFDA, ClinicalTrials.gov
- **Protein networks** — STRING-style force-directed interaction graph (custom SVG)
- **Expression** — GTEx tissue heatmaps, Human Protein Atlas

Logged-in users can **save research projects** (gene + variant + disease + layout) with a snapshot
history.

## Architecture

The backend acts as a **data broker**: each incoming request fans out **up to 12 external API calls
in parallel** (`asyncio.gather`) with graceful degradation — a failing source returns an empty result
instead of breaking the whole endpoint.

```
React SPA (Vite, TypeScript)
   │  REST + JWT cookie auth
FastAPI backend  ──►  34 domain services (one file per database)
   │                     each: mock-mode branch + real HTTP call (httpx + tenacity retry)
SQLAlchemy (async, SQLite/PostgreSQL)  ──►  Users · Sessions · Projects · Snapshots
```

- **34 service modules**, one per external database, each isolated and independently testable.
- **`mock_mode`** (default on) returns high-fidelity fixture data — the whole app runs and is
  testable with **zero real network calls**.
- **Auth:** JWT cookie-based (python-jose + passlib/bcrypt), async SQLAlchemy sessions.
- **i18n:** English / Polish via a React context.

## Tech highlights

| Area | Details |
|------|---------|
| Backend | FastAPI, async SQLAlchemy, `httpx` + `tenacity` retries, Pydantic settings |
| Frontend | React 18, TypeScript, Vite, Mol\* (molstar), Recharts, dark/glassmorphic UI |
| Concurrency | `asyncio.gather` fan-out, per-service graceful failure |
| Auth & data | JWT cookies, bcrypt, Users/Sessions/Projects/Snapshots ORM |
| Testing | End-to-end suite + mock HTTP layer for deterministic runs |

## Running locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py            # FastAPI on http://localhost:8000  (mock_mode on by default)

# Frontend
cd frontend
npm install
npm run dev              # Vite dev server
```

Set `mock_mode = False` in the backend config to hit the real external APIs.

## Project status

Personal portfolio project demonstrating async API orchestration, biomedical data integration and
production-style frontend architecture. See [`PROJECT.md`](PROJECT.md) for the full design and
[`TEST_INFRA.md`](TEST_INFRA.md) for the testing approach.
