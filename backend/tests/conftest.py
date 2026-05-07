import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.scalar.return_value = 1  # one user exists → setup_required=False
    return session


@pytest.fixture
def client(mock_db):
    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
