# Container image for the Proteotheca (BioMed Explorer) FastAPI backend.
# Works on Railway, Fly.io, Render (Docker), or any container host.
FROM python:3.12-slim

WORKDIR /app

# System libs curl_cffi needs at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV MOCK_MODE=false
# Host platforms inject $PORT; default to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
