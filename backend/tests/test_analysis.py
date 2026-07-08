import pytest
from io import BytesIO

@pytest.mark.asyncio
async def test_align_endpoint(client):
    payload = {
        "sequences_fasta": ">Seq1\nMAALSGGGG\n>Seq2\nMAALSGGGG\n"
    }
    response = await client.post("/api/analysis/sequence/align", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "alignment" in data
    assert data["status"] == "FINISHED"

@pytest.mark.asyncio
async def test_similarity_endpoint(client):
    payload = {
        "sequence": "MAALSGGGG"
    }
    response = await client.post("/api/analysis/sequence/similarity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hits" in data
    assert len(data["hits"]) > 0

@pytest.mark.asyncio
async def test_foldseek_endpoint(client):
    # Prepare a mock upload file
    file_content = b"ATOM      1  N   MET A   1      27.340  24.430   2.610  1.00  9.90           N"
    files = {"file": ("test.pdb", file_content, "application/octet-stream")}
    response = await client.post("/api/analysis/structures/foldseek", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert data["status"] == "COMPLETE"

@pytest.mark.asyncio
async def test_compound_endpoint(client):
    response = await client.get("/api/analysis/compounds/dabrafenib")
    assert response.status_code == 200
    data = response.json()
    assert "cid" in data
    assert data["name"] == "DABRAFENIB"
    assert "smiles" in data

@pytest.mark.asyncio
async def test_unibind_endpoint(client):
    response = await client.get("/api/analysis/tfbs/unibind/SMAD3")
    assert response.status_code == 200
    data = response.json()
    assert "datasets" in data
    assert len(data["datasets"]) > 0
