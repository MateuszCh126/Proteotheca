import pytest

@pytest.mark.asyncio
async def test_get_variant_rsid(client):
    response = await client.get("/api/variants/rs113488022")
    assert response.status_code == 200
    data = response.json()
    
    assert data["variant_id"] == "rs113488022"
    assert "clinvar" in data
    assert "gnomad" in data
    assert "gtex" in data
    
    # Verify ClinVar shape
    assert data["clinvar"]["pathogenicity"] == "Pathogenic"
    assert "significance" in data["clinvar"]
    assert "review_status" in data["clinvar"]
    
    # Verify gnomAD shape
    assert isinstance(data["gnomad"]["allele_frequency"], float)
    assert isinstance(data["gnomad"]["homozygote_count"], int)
    assert isinstance(data["gnomad"]["populations"], list)
    assert len(data["gnomad"]["populations"]) > 0
    assert "pop" in data["gnomad"]["populations"][0]
    assert "freq" in data["gnomad"]["populations"][0]
    
    # Verify GTEx shape
    assert isinstance(data["gtex"]["eqtls"], list)
    assert len(data["gtex"]["eqtls"]) > 0
    assert "tissue" in data["gtex"]["eqtls"][0]
    assert "gene_symbol" in data["gtex"]["eqtls"][0]
    assert "p_value" in data["gtex"]["eqtls"][0]
    assert "nes" in data["gtex"]["eqtls"][0]

@pytest.mark.asyncio
async def test_get_variant_coordinates(client):
    response = await client.get("/api/variants/7-140753336-T-A")
    assert response.status_code == 200
    data = response.json()
    assert data["variant_id"] == "7-140753336-T-A"

@pytest.mark.asyncio
async def test_get_variant_invalid(client):
    response = await client.get("/api/variants/invalid_variant")
    assert response.status_code == 400
