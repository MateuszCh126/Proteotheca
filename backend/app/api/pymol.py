import logging
from typing import List, Optional
from fastapi import APIRouter, Response, HTTPException
from pydantic import BaseModel

from app.services import pymol_service

logger = logging.getLogger(__name__)
router = APIRouter()

class PyMOLRenderRequest(BaseModel):
    pdb_id: str
    representation: str = "cartoon"
    color_by: str = "plddt"
    residues: Optional[List[int]] = None

@router.post("/render")
async def render_protein(req: PyMOLRenderRequest):
    """
    Renders a protein structure using PyMOL and returns it as a PNG image.
    """
    try:
        image_bytes = pymol_service.render_protein(
            pdb_id=req.pdb_id,
            representation=req.representation,
            color_by=req.color_by,
            residues=req.residues
        )
        return Response(content=image_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Error in PyMOL rendering: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to render protein structure.")
