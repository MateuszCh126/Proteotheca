import pytest

pytestmark = pytest.mark.asyncio


async def test_register_returns_safe_user_and_cookie(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ADA@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "ada@example.com"
    assert "password_hash" not in body["user"]
    assert "biomed_token" in response.cookies
    assert "httponly" in response.headers["set-cookie"].lower()


async def test_register_duplicate_email_returns_409(client):
    payload = {
        "first_name": "Ada",
        "last_name": "Lovelace",
        "email": "ada@example.com",
        "password": "password123",
    }
    assert (await client.post("/api/auth/register", json=payload)).status_code == 201

    response = await client.post("/api/auth/register", json=payload)

    assert response.status_code == 409


async def test_login_and_me_roundtrip(client):
    payload = {
        "first_name": "Grace",
        "last_name": "Hopper",
        "email": "grace@example.com",
        "password": "password123",
    }
    await client.post("/api/auth/register", json=payload)

    login = await client.post(
        "/api/auth/login",
        json={
            "email": "grace@example.com",
            "password": "password123",
        },
    )
    assert login.status_code == 200

    me = await client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "grace@example.com"
    assert "password_hash" not in me.json()


async def test_login_wrong_password_returns_401(client):
    await client.post(
        "/api/auth/register",
        json={
            "first_name": "Alan",
            "last_name": "Turing",
            "email": "alan@example.com",
            "password": "password123",
        },
    )

    response = await client.post(
        "/api/auth/login",
        json={
            "email": "alan@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401


async def test_logout_revokes_session(client):
    await client.post(
        "/api/auth/register",
        json={
            "first_name": "Rosalind",
            "last_name": "Franklin",
            "email": "rosalind@example.com",
            "password": "password123",
        },
    )

    logout = await client.post("/api/auth/logout")
    assert logout.status_code == 200

    me = await client.get("/api/auth/me")
    assert me.status_code == 401
