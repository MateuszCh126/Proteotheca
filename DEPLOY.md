# Deploying Proteotheca (frontend on Vercel + backend on Render)

The frontend (Vite/React) is static and already on Vercel. The backend (FastAPI) calls
30+ live biomedical APIs and must be hosted separately. Order matters: **host the backend
first**, then point the frontend at it — otherwise the deployed site calls `localhost` and
shows a data error.

## 1. Backend → Render (free tier)

1. Push this repo to GitHub (the `render.yaml` and `backend/Dockerfile` are included).
2. Render → **New +** → **Blueprint** → select this repo. Render reads `render.yaml`:
   - build: `pip install -r requirements.txt` (in `backend/`)
   - start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - env: `MOCK_MODE=false`, `CORS_ALLOWED_ORIGINS=https://proteotheca.vercel.app`,
     `JWT_SECRET` (auto-generated).
3. Deploy. You get a URL like `https://proteotheca-api.onrender.com`.
4. Sanity check: open `https://proteotheca-api.onrender.com/api/genes/BRAF` — you should
   see real JSON (35 transcripts, UniProt `P15056`).

> Prefer Railway/Fly.io? Use `backend/Dockerfile` instead — same env vars.

## 2. Point the frontend at the backend (Vercel)

1. Vercel → your Proteotheca project → **Settings → Environment Variables**.
2. Add `VITE_API_URL = https://proteotheca-api.onrender.com` (Production).
3. Redeploy the frontend (Deployments → Redeploy). Vite inlines `VITE_API_URL` at build time.

## 3. CORS

`CORS_ALLOWED_ORIGINS` on the backend must contain your exact Vercel origin
(`https://proteotheca.vercel.app`, and any preview/custom domains). It's already the default,
and set in `render.yaml`.

## Honest caveats

- **Cold start:** Render free tier sleeps after ~15 min idle; the first visit then waits
  ~50 s for the backend to wake. A cron ping (e.g. cron-job.org hitting `/`) keeps it warm.
- **Load time:** the default readout aggregates 30+ live APIs → ~10 s on a warm backend.
  There's a loading state; it is inherent to querying real sources.
- **Database:** SQLite lives on Render's ephemeral disk, so accounts / saved projects reset
  on redeploy. The read-only data readout doesn't need the DB. For persistence, attach a
  Render Disk or a free Postgres and set `DATABASE_URL`.
- **`curl_cffi`:** required — ClinicalTrials.gov blocks plain server requests by TLS
  fingerprint; `curl_cffi` impersonates a browser so the API answers. Its wheels install
  cleanly on the Python 3.12 image.
