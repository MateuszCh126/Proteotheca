import pytest
import pytest_asyncio
import os
import httpx
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from unittest.mock import patch, MagicMock

from app.database import get_session
from app.dependencies import get_db
from app.models import Base, User, UserSession
from app.main import app
from app.config import settings
from app.security import hash_password, normalize_email, create_token_payload

@pytest_asyncio.fixture
async def client_with_db(tmp_path):
    db_path = tmp_path / "test_adv.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True)
    TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_session():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_db] = override_get_session
    app.state.http_client = httpx.AsyncClient()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, TestingSessionLocal
    await app.state.http_client.aclose()
    app.dependency_overrides.clear()
    await engine.dispose()

# ----------------- SECURITY & AUTHENTICATION BOUNDARY CASES -----------------

@pytest.mark.asyncio
async def test_get_current_user_no_token(client_with_db):
    client, _ = client_with_db
    response = await client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client_with_db):
    client, _ = client_with_db
    # Pass a completely bogus token
    response = await client.get("/api/auth/me", headers={"Authorization": "Bearer bogus_token"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"

@pytest.mark.asyncio
async def test_get_current_user_missing_payload(client_with_db):
    client, _ = client_with_db
    # Generate token with missing sub/jti
    from jose import jwt
    payload = {"role": "user"}  # Missing sub and jti
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"

@pytest.mark.asyncio
async def test_get_current_user_revoked_session(client_with_db):
    client, session_maker = client_with_db
    # 1. Register a user
    reg_payload = {
        "first_name": "Revoke",
        "last_name": "Test",
        "email": "revoke@example.com",
        "password": "password123"
    }
    reg_resp = await client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    
    # 2. Get session from db and revoke it
    from app.models import utcnow
    async with session_maker() as session:
        from sqlalchemy import select
        res = await session.execute(select(UserSession))
        db_session = res.scalars().first()
        assert db_session is not None
        db_session.revoked_at = utcnow()
        await session.commit()
        
    # 3. Try to access /me (the cookie is already set from register response)
    me_resp = await client.get("/api/auth/me")
    assert me_resp.status_code == 401
    assert me_resp.json()["detail"] == "Invalid session"

@pytest.mark.asyncio
async def test_get_current_user_expired_session(client_with_db):
    client, session_maker = client_with_db
    # 1. Register
    reg_payload = {
        "first_name": "Expire",
        "last_name": "Test",
        "email": "expire@example.com",
        "password": "password123"
    }
    reg_resp = await client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    
    # 2. Set expires_at to the past
    from datetime import datetime, timezone, timedelta
    async with session_maker() as session:
        from sqlalchemy import select
        res = await session.execute(select(UserSession))
        db_session = res.scalars().first()
        db_session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        await session.commit()
        
    # 3. Access /me
    me_resp = await client.get("/api/auth/me")
    assert me_resp.status_code == 401
    assert me_resp.json()["detail"] == "Invalid session"

@pytest.mark.asyncio
async def test_get_current_user_deleted_user(client_with_db):
    client, session_maker = client_with_db
    # 1. Register
    reg_payload = {
        "first_name": "Delete",
        "last_name": "Test",
        "email": "delete@example.com",
        "password": "password123"
    }
    reg_resp = await client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    
    # 2. Mark user as deleted in DB
    from app.models import utcnow
    async with session_maker() as session:
        from sqlalchemy import select
        res = await session.execute(select(User))
        db_user = res.scalars().first()
        db_user.deleted_at = utcnow()
        await session.commit()
        
    # 3. Access /me
    me_resp = await client.get("/api/auth/me")
    assert me_resp.status_code == 401
    assert me_resp.json()["detail"] == "Invalid user"

@pytest.mark.asyncio
async def test_login_deleted_user(client_with_db):
    client, session_maker = client_with_db
    # 1. Register
    reg_payload = {
        "first_name": "LoginDel",
        "last_name": "Test",
        "email": "logindel@example.com",
        "password": "password123"
    }
    await client.post("/api/auth/register", json=reg_payload)
    
    # Logout to clear session
    await client.post("/api/auth/logout")
    
    # 2. Mark user as deleted in DB
    from app.models import utcnow
    async with session_maker() as session:
        from sqlalchemy import select
        res = await session.execute(select(User))
        db_user = res.scalars().first()
        db_user.deleted_at = utcnow()
        await session.commit()
        
    # 3. Attempt login
    login_resp = await client.post("/api/auth/login", json={
        "email": "logindel@example.com",
        "password": "password123"
    })
    assert login_resp.status_code == 401
    assert login_resp.json()["detail"] == "Invalid email or password"

# ----------------- PYMOL RENDERING PARAMETERS & FAILURES -----------------

@pytest.mark.asyncio
async def test_pymol_render_all_options(client_with_db):
    client, _ = client_with_db
    
    # Test representation = surface
    resp = await client.post("/api/pymol/render", json={
        "pdb_id": "1UWH",
        "representation": "surface",
        "color_by": "charge",
        "residues": [10, 20]
    })
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    assert len(resp.content) > 0

    # Test representation = spheres
    resp = await client.post("/api/pymol/render", json={
        "pdb_id": "1UWH",
        "representation": "spheres",
        "color_by": "charge",
        "residues": []
    })
    assert resp.status_code == 200

    # Test representation = lines & invalid coloring option
    resp = await client.post("/api/pymol/render", json={
        "pdb_id": "1UWH",
        "representation": "lines",
        "color_by": "invalid_color_mode",
        "residues": None
    })
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_pymol_render_mock_png_missing(client_with_db):
    client, _ = client_with_db
    # Mock os.path.exists to return False so that the 1x1 PNG fallback is triggered
    with patch("os.path.exists", return_value=False):
        resp = await client.post("/api/pymol/render", json={
            "pdb_id": "1UWH",
            "representation": "cartoon",
            "color_by": "plddt"
        })
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "image/png"
        # 1x1 transparent PNG length is 67 or 70 bytes depending on python version
        assert len(resp.content) in (67, 70)

# ----------------- CONCURRENCY EXCEPTION HANDLING (GRACEFUL DEGRADATION) -----------------

@pytest.mark.asyncio
async def test_gene_endpoint_graceful_degradation(client_with_db):
    client, _ = client_with_db
    # Mock ensembl and uniprot to raise exceptions
    async def mock_sleep(delay, result=None):
        if result == {}:
            return {"target_id": "", "associations": []}
        return result

    with patch("app.services.ensembl_service.get_gene_data", side_effect=Exception("Ensembl Error")):
        with patch("app.services.uniprot_service.get_uniprot_data", side_effect=Exception("UniProt Error")):
            with patch("app.api.genes.asyncio.sleep", new=mock_sleep):
                response = await client.get("/api/genes/BRAF")
                assert response.status_code == 200
                data = response.json()
                assert data["symbol"] == "BRAF"
                assert data["ensembl"]["gene_id"] == ""
                assert data["ensembl"]["transcripts"] == []
                assert data["uniprot"]["accession"] == ""
                assert data["uniprot"]["name"] == ""
                assert data["uniprot"]["sequence"] == ""

@pytest.mark.asyncio
async def test_variant_endpoint_graceful_degradation(client_with_db):
    client, _ = client_with_db
    # Mock services queried in variants endpoint to raise exceptions
    with patch("app.services.clinvar_service.get_clinvar_data", side_effect=Exception("ClinVar Fail")):
        with patch("app.services.gnomad_service.get_gnomad_data", side_effect=Exception("gnomAD Fail")):
            with patch("app.services.gtex_service.get_gtex_data", side_effect=Exception("GTEx Fail")):
                response = await client.get("/api/variants/rs113488022")
                assert response.status_code == 200
                data = response.json()
                assert data["variant_id"] == "rs113488022"
                assert data["clinvar"]["pathogenicity"] == "Uncertain Significance"
                assert data["clinvar"]["significance"] == "Error"
                assert data["gnomad"]["allele_frequency"] == 0.0
                assert data["gtex"]["eqtls"] == []

@pytest.mark.asyncio
async def test_disease_endpoint_graceful_degradation(client_with_db):
    client, _ = client_with_db
    # Mock services queried in disease endpoint to raise exceptions
    with patch("app.services.opentargets_service.get_disease_associations", side_effect=Exception("OT Fail")):
        with patch("app.services.chembl_service.get_active_compounds", side_effect=Exception("ChEMBL Fail")):
            with patch("app.services.clinicaltrials_service.get_clinical_trials", side_effect=Exception("Trials Fail")):
                response = await client.get("/api/diseases/melanoma")
                assert response.status_code == 200
                data = response.json()
                assert data["disease_name"] == "Melanoma"
                assert data["opentargets"]["associated_genes"] == []
                assert data["chembl"]["active_compounds"] == []
                assert data["clinical_trials"]["trial_count"] == 0

# ----------------- VARIANT COORDINATE RESOLUTION (NON-MOCK MODE) -----------------

class MockResponse:
    def __init__(self, json_data, status_code=200):
        self._json_data = json_data
        self.status_code = status_code
    def json(self):
        return self._json_data
    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("Error", request=None, response=None)

@pytest.mark.asyncio
async def test_resolve_rsid_non_mock_clinvar(client_with_db):
    client, _ = client_with_db
    # Toggle mock_mode off temporarily
    settings.mock_mode = False
    try:
        # Mock ClinVar returning coordinates
        mock_esearch_resp = MockResponse({
            "esearchresult": {"idlist": ["12345"]}
        })
        mock_esummary_resp = MockResponse({
            "result": {
                "12345": {
                    "variation_loc": [
                        {"assembly": "GRCh37", "chr": "7", "start": "111", "ref": "A", "alt": "G"},
                        {"assembly": "GRCh38", "chr": "7", "start": "140753336", "ref": "T", "alt": "A"}
                    ]
                }
            }
        })
        
        async def mock_get(url, **kwargs):
            if "esearch.fcgi" in str(url):
                return mock_esearch_resp
            elif "esummary.fcgi" in str(url):
                return mock_esummary_resp
            return MockResponse({})

        # Mock request.app.state.http_client.get
        with patch.object(app.state.http_client, "get", side_effect=mock_get):
            response = await client.get("/api/variants/rs113488022")
            assert response.status_code == 200
            # The clean_id should still return rs113488022
            assert response.json()["variant_id"] == "rs113488022"
    finally:
        settings.mock_mode = True

@pytest.mark.asyncio
async def test_resolve_rsid_non_mock_dbsnp(client_with_db):
    client, _ = client_with_db
    settings.mock_mode = False
    try:
        # Case where ClinVar is empty, but dbSNP returns a UID
        mock_esearch_clinvar = MockResponse({"esearchresult": {"idlist": []}})
        mock_esearch_snp = MockResponse({"esearchresult": {"idlist": ["98765"]}})
        mock_esummary_snp = MockResponse({
            "result": {
                "98765": {
                    "spdis": [{
                        "seq_id": "NC_000007.14",
                        "position": 140753335,
                        "deleted": "T",
                        "inserted": "A"
                    }]
                }
            }
        })
        
        async def mock_get(url, **kwargs):
            params = kwargs.get("params", {})
            if "esearch.fcgi" in str(url):
                if params.get("db") == "clinvar":
                    return mock_esearch_clinvar
                return mock_esearch_snp
            elif "esummary.fcgi" in str(url):
                return mock_esummary_snp
            return MockResponse({})

        with patch.object(app.state.http_client, "get", side_effect=mock_get):
            response = await client.get("/api/variants/rs113488022")
            assert response.status_code == 200
            assert response.json()["variant_id"] == "rs113488022"
    finally:
        settings.mock_mode = True

@pytest.mark.asyncio
async def test_resolve_rsid_non_mock_ensembl_fallback(client_with_db):
    client, _ = client_with_db
    settings.mock_mode = False
    try:
        # Case where NCBI fails, fallback to Ensembl Variation
        mock_esearch_error = Exception("NCBI Down")
        mock_ensembl_resp = MockResponse({
            "mappings": [{
                "assembly_name": "GRCh38",
                "seq_region_name": "7",
                "start": 140753336,
                "allele_string": "T/A"
            }]
        })
        
        async def mock_get(url, **kwargs):
            if "eutils" in str(url):
                raise mock_esearch_error
            elif "ensembl.org/variation" in str(url):
                return mock_ensembl_resp
            return MockResponse({}, status_code=404)

        with patch.object(app.state.http_client, "get", side_effect=mock_get):
            response = await client.get("/api/variants/rs113488022")
            assert response.status_code == 200
            assert response.json()["variant_id"] == "rs113488022"
    finally:
        settings.mock_mode = True

@pytest.mark.asyncio
async def test_resolve_rsid_non_mock_all_fail(client_with_db):
    client, _ = client_with_db
    settings.mock_mode = False
    try:
        # Case where everything fails: should fallback to default coordinates
        async def mock_get(url, **kwargs):
            raise Exception("All APIs Dead")

        with patch.object(app.state.http_client, "get", side_effect=mock_get):
            response = await client.get("/api/variants/rs113488022")
            assert response.status_code == 200
            assert response.json()["variant_id"] == "rs113488022"
    finally:
        settings.mock_mode = True
