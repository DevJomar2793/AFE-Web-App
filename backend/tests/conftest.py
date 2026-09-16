from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete

from app.database import async_session_factory, engine
from app.main import app
from app.models import User
from app.security import create_access_token, hash_password


@pytest.fixture
async def unauthenticated_client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture(scope="session")
async def authentication_headers() -> AsyncIterator[dict[str, str]]:
    user = User(
        email=f"test-{uuid4()}@example.com",
        password_hash=hash_password("test-password"),
    )
    async with async_session_factory() as session:
        session.add(user)
        await session.commit()
        await session.refresh(user)

    try:
        yield {"Authorization": f"Bearer {create_access_token(user)}"}
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(User).where(User.id == user.id))
            await session.commit()


@pytest.fixture
async def client(
    unauthenticated_client: AsyncClient,
    authentication_headers: dict[str, str],
) -> AsyncIterator[AsyncClient]:
    unauthenticated_client.headers.update(authentication_headers)
    yield unauthenticated_client


@pytest.fixture(scope="session", autouse=True)
async def dispose_database_engine() -> AsyncIterator[None]:
    yield
    await engine.dispose()
