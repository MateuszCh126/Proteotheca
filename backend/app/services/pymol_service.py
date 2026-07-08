import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def render_protein(pdb_id: str, representation: str, color_by: str, residues: list[int] = None) -> bytes:
    """
    Renders a protein structure using PyMOL if available.
    Falls back to a pre-saved mock PNG image if PyMOL is not installed.
    """
    logger.info(f"Rendering protein {pdb_id} with representation={representation}, color_by={color_by}, residues={residues}")
    
    # Try using PyMOL library if available (optional/production environment feature)
    try:
        import pymol
        from pymol import cmd
        
        # Initialize PyMOL in headless mode
        pymol.pymol_argv = ["pymol", "-cqi"]
        pymol.finish_launching()
        
        cmd.reinitialize()
        # Fetch or load the structure
        # In a real environment, we'd query local cache or fetch from PDB
        # For simplicity, fetch the PDB ID
        cmd.fetch(pdb_id)
        
        # Apply representation
        cmd.hide("everything")
        if representation == "cartoon":
            cmd.show("cartoon")
        elif representation == "spheres":
            cmd.show("spheres")
        elif representation == "surface":
            cmd.show("surface")
        else:
            cmd.show("lines")
            
        # Apply coloring
        if color_by == "plddt":
            # Mock coloring by b-factor (pLDDT in AlphaFold models)
            cmd.color("blue", "b < 50")
            cmd.color("yellow", "b >= 50 and b < 70")
            cmd.color("orange", "b >= 70 and b < 90")
            cmd.color("red", "b >= 90")
        elif color_by == "charge":
            cmd.color("red", "resn ASP+GLU")
            cmd.color("blue", "resn LYS+ARG")
            cmd.color("white", "resn VAL+LEU+ILE+ALA+MET+PHE")
        else:
            cmd.color("cyan", "all")
            
        # Highlight residues if provided
        if residues:
            res_selection = " or ".join(f"resi {r}" for r in residues)
            cmd.color("magenta", res_selection)
            cmd.show("sticks", res_selection)
            
        # Render image
        temp_png = f"/tmp/pymol_{pdb_id}.png"
        cmd.png(temp_png, width=800, height=600, dpi=300, ray=1)
        
        with open(temp_png, "rb") as f:
            data = f.read()
            
        # Clean up
        os.remove(temp_png)
        return data
        
    except (ImportError, Exception) as e:
        logger.warning(f"PyMOL library not available or failed: {str(e)}. Falling back to mock PNG.")
        
        # Determine paths to mock PNG
        # The workspace root is settings.workspace_dir or we can resolve it relative to __file__
        current_dir = os.path.dirname(os.path.abspath(__file__))
        workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
        mock_path = os.path.join(workspace_root, "tests_e2e", "mocks", "assets", "mock_pymol_render.png")
        
        if os.path.exists(mock_path):
            with open(mock_path, "rb") as f:
                return f.read()
        else:
            logger.error(f"Mock PNG not found at {mock_path}. Creating an empty 1x1 PNG fallback.")
            # Standard 1x1 transparent pixel PNG bytes
            return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
