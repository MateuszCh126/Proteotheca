import pytest

@pytest.mark.asyncio
async def test_diseases_endpoint(client):
    response = await client.get("/api/diseases/melanoma")
    assert response.status_code == 200
    data = response.json()
    assert data["disease_name"] == "Melanoma"
    assert "opentargets" in data
    assert "chembl" in data
    assert "clinical_trials" in data
    assert "openfda" in data
    assert "ols" in data
