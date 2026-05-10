import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient

from app.config import settings

# Disable community sync during tests — the lifespan would otherwise try to
# open a real DB session, which isn't available in unit-test runs.
settings.community_sync_on_startup = False

from app.main import app  # noqa: E402  — must come after settings override
from app.database import get_db  # noqa: E402


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
