import pytest

pytestmark = pytest.mark.asyncio


async def register(client, email):
    response = await client.post(
        "/api/auth/register",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": email,
            "password": "password123",
        },
    )
    assert response.status_code == 201


async def test_create_and_list_project(client):
    await register(client, "owner@example.com")

    created = await client.post(
        "/api/projects",
        json={
            "title": "BRAF exploration",
            "description": "Kinase research",
            "entity_type": "gene",
            "query": "BRAF",
            "tags": ["oncology", "kinase"],
            "state": {"gene": {"symbol": "BRAF"}},
        },
    )

    assert created.status_code == 201
    project = created.json()
    assert project["title"] == "BRAF exploration"
    assert project["latest_snapshot"]["state"]["gene"]["symbol"] == "BRAF"

    listed = await client.get("/api/projects")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [project["id"]]


async def test_project_access_is_owner_only(client):
    await register(client, "owner@example.com")
    created = await client.post(
        "/api/projects",
        json={
            "title": "BRCA1 exploration",
            "entity_type": "gene",
            "query": "BRCA1",
            "tags": [],
            "state": {"gene": {"symbol": "BRCA1"}},
        },
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    await client.post("/api/auth/logout")
    await register(client, "other@example.com")

    response = await client.get(f"/api/projects/{project_id}")
    assert response.status_code == 404


async def test_add_snapshot_and_archive_disappears_from_list(client):
    await register(client, "owner@example.com")
    created = await client.post(
        "/api/projects",
        json={
            "title": "Mixed exploration",
            "entity_type": "mixed",
            "query": "session",
            "tags": ["draft"],
            "state": {"gene": {"symbol": "TP53"}},
        },
    )
    project_id = created.json()["id"]

    snapshot = await client.post(
        f"/api/projects/{project_id}/snapshots",
        json={
            "name": "after variant load",
            "state": {"gene": {"symbol": "TP53"}, "variant": {"variant_id": "rs1"}},
        },
    )
    assert snapshot.status_code == 201

    project = await client.get(f"/api/projects/{project_id}")
    assert project.status_code == 200
    assert project.json()["latest_snapshot"]["name"] == "after variant load"

    deleted = await client.delete(f"/api/projects/{project_id}")
    assert deleted.status_code == 200

    listed = await client.get("/api/projects")
    assert listed.status_code == 200
    assert listed.json() == []
