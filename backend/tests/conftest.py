from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.auth import create_access_token, hash_password
from app.database import engine
from app.main import app
from app.database import async_session_factory
from app.models import User


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    test_email = "__authenticated_api_test__@example.com"
    async with async_session_factory() as session:
        await session.execute(delete(User).where(User.email == test_email))
        user = User(
            email=test_email,
            password_hash=hash_password("test-password"),
            is_active=True,
            is_admin=False,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client.headers["Authorization"] = f"Bearer {create_access_token(user)}"
        yield client

    async with async_session_factory() as session:
        await session.execute(delete(User).where(User.email == test_email))
        await session.commit()


@pytest.fixture(scope="session", autouse=True)
async def dispose_database_engine() -> AsyncIterator[None]:
    yield
    await engine.dispose()
