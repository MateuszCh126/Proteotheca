import pytest
import os
import sys
from httpx import AsyncClient

# Add the backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__)) # tests
backend_dir = os.path.dirname(current_dir)             # backend
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

@pytest.fixture
async def client():
    # Using AsyncClient with app triggers lifespan events, initializing app.state.http_client
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
