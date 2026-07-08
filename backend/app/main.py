from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api import auth, genes, variants, diseases, literature, projects, pymol, analysis
from app.config import settings
from app.database import create_all

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.auto_create_tables:
        await create_all()
    # Initialize the asynchronous HTTPX client on startup
    client = httpx.AsyncClient()
    app.state.http_client = client
    yield
    # Close the HTTPX client on shutdown
    await client.aclose()

app = FastAPI(
    title="BioMed Explorer Portal API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(genes.router, prefix="/api/genes", tags=["genes"])
app.include_router(variants.router, prefix="/api/variants", tags=["variants"])
app.include_router(diseases.router, prefix="/api/diseases", tags=["diseases"])
app.include_router(literature.router, prefix="/api/literature", tags=["literature"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(pymol.router, prefix="/api/pymol", tags=["pymol"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "BioMed Explorer Portal Backend running"}
