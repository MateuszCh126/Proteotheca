import pytest

@pytest.mark.asyncio
async def test_get_gene_braf(client):
    response = await client.get("/api/genes/BRAF")
    assert response.status_code == 200
    data = response.json()
    
    assert data["symbol"] == "BRAF"
    assert "ensembl" in data
    assert "uniprot" in data
    assert "opentargets" in data
    
    # Verify Ensembl shape
    assert data["ensembl"]["gene_id"] == "ENSG00000157764"
    assert isinstance(data["ensembl"]["transcripts"], list)
    assert len(data["ensembl"]["transcripts"]) > 0
    assert "transcript_id" in data["ensembl"]["transcripts"][0]
    assert "length" in data["ensembl"]["transcripts"][0]
    
    # Verify UniProt shape
    assert data["uniprot"]["accession"] == "P15056"
    assert data["uniprot"]["name"] == "BRAF_HUMAN"
    assert "sequence" in data["uniprot"]
    
    # Verify OpenTargets shape
    assert data["opentargets"]["target_id"] == "ENSG00000157764"
    assert isinstance(data["opentargets"]["associations"], list)
    assert len(data["opentargets"]["associations"]) > 0
    assert "disease_id" in data["opentargets"]["associations"][0]
    assert "disease_name" in data["opentargets"]["associations"][0]
    assert "score" in data["opentargets"]["associations"][0]

@pytest.mark.asyncio
async def test_get_gene_unknown(client):
    response = await client.get("/api/genes/UNKNOWN")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "UNKNOWN"
    assert data["ensembl"]["gene_id"].startswith("ENSG")
    assert len(data["ensembl"]["transcripts"]) > 0
