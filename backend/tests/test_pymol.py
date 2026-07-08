import pytest

@pytest.mark.asyncio
async def test_pymol_render_endpoint(client):
    payload = {
        "pdb_id": "1UWH",
        "representation": "cartoon",
        "color_by": "plddt",
        "residues": [599, 600, 601]
    }
    response = await client.post("/api/pymol/render", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert len(response.content) > 0
