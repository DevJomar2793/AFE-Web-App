from uuid import uuid4

import jwt
import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.database import async_session_factory
from app.config import settings
from app.models import User
from app.security import verify_password


@pytest.fixture
async def registered_user() -> tuple[str, str]:
    email = f"auth-{uuid4()}@example.com"
    password = "secure-password"
    yield email, password

    async with async_session_factory() as session:
        await session.execute(delete(User).where(User.email == email))
        await session.commit()


@pytest.mark.asyncio
async def test_registers_user_with_a_hashed_password(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user

    response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email.upper(), "password": password},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data

    async with async_session_factory() as session:
        user = await session.scalar(select(User).where(User.id == data["id"]))

    assert user is not None
    assert user.password_hash != password
    assert verify_password(password, user.password_hash)


@pytest.mark.asyncio
async def test_registration_rejects_invalid_or_duplicate_accounts(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    first_response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    duplicate_response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    invalid_email_response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": password},
    )
    short_password_response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": f"short-{uuid4()}@example.com", "password": "1234"},
    )
    blank_password_response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": f"blank-{uuid4()}@example.com", "password": "     "},
    )

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 409
    assert invalid_email_response.status_code == 422
    assert short_password_response.status_code == 422
    assert blank_password_response.status_code == 422


@pytest.mark.asyncio
async def test_login_and_current_user_profile(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = login_response.json()["access_token"]
    profile_response = await unauthenticated_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == email


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    wrong_password_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
    )
    unknown_email_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": f"missing-{uuid4()}@example.com", "password": password},
    )

    assert wrong_password_response.status_code == 401
    assert unknown_email_response.status_code == 401
    assert wrong_password_response.json()["detail"] == "Incorrect email or password"
    assert unknown_email_response.json()["detail"] == "Incorrect email or password"


@pytest.mark.asyncio
async def test_protected_routes_require_a_valid_token(
    unauthenticated_client: AsyncClient,
) -> None:
    missing_token_response = await unauthenticated_client.get(
        "/api/v1/inventory/get-item",
    )
    invalid_token_response = await unauthenticated_client.get(
        "/api/v1/inventory/get-item",
        headers={"Authorization": "Bearer invalid-token"},
    )
    expired_token = jwt.encode(
        {"sub": "1", "exp": 0},
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    expired_token_response = await unauthenticated_client.get(
        "/api/v1/inventory/get-item",
        headers={"Authorization": f"Bearer {expired_token}"},
    )

    assert missing_token_response.status_code == 401
    assert invalid_token_response.status_code == 401
    assert expired_token_response.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user_token_is_rejected(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    login_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    async with async_session_factory() as session:
        user = await session.scalar(select(User).where(User.email == email))
        assert user is not None
        user.is_active = False
        await session.commit()

    response = await unauthenticated_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 401
