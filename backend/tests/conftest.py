import pytest
import pytest_asyncio
import os
import sys
import httpx
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

# Add the backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__)) # tests
backend_dir = os.path.dirname(current_dir)             # backend
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import get_session
from app.dependencies import get_db
from app.models import Base
from app.main import app

@pytest_asyncio.fixture
async def client(tmp_path):
    db_path = tmp_path / "test.db"
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
        yield ac
    await app.state.http_client.aclose()
    app.dependency_overrides.clear()

    await engine.dispose()
