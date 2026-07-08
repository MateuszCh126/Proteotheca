import pytest

@pytest.mark.asyncio
async def test_literature_endpoint(client):
    response = await client.get("/api/literature?query=melanoma")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "melanoma"
    assert isinstance(data["pubmed"], list)
    assert isinstance(data["biorxiv"], list)
    assert isinstance(data["openalex"], list)
    assert isinstance(data["arxiv"], list)
    assert isinstance(data["europepmc"], list)
