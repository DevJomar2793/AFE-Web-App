from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.database import async_session_factory
from app.config import settings
from app.models import AuthSession, User
from app.security import hash_refresh_token, verify_password


async def activate_user(email: str) -> None:
    async with async_session_factory() as session:
        user = await session.scalar(select(User).where(User.email == email))
        assert user is not None
        user.is_active = True
        await session.commit()


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
    assert data["is_active"] is False
    assert data["is_admin"] is False
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
    await activate_user(email)

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
    assert profile_response.json()["is_admin"] is False


@pytest.mark.asyncio
async def test_login_without_remember_me_does_not_create_refresh_session(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    await activate_user(email)

    response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert response.status_code == 200
    assert response.json()["refresh_token"] is None
    assert response.json()["refresh_token_expires_at"] is None

    async with async_session_factory() as session:
        user = await session.scalar(select(User).where(User.email == email))
        assert user is not None
        auth_session = await session.scalar(
            select(AuthSession).where(AuthSession.user_id == user.id),
        )
    assert auth_session is None


@pytest.mark.asyncio
async def test_remembered_session_refreshes_rotates_and_logs_out(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    await activate_user(email)

    login_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    login_data = login_response.json()
    refresh_token = login_data["refresh_token"]
    original_expiration = login_data["refresh_token_expires_at"]

    assert login_response.status_code == 200
    assert isinstance(refresh_token, str)
    assert refresh_token
    expiration = datetime.fromisoformat(original_expiration)
    assert expiration > datetime.now(timezone.utc) + timedelta(days=29)
    assert expiration <= datetime.now(timezone.utc) + timedelta(days=30, minutes=1)

    async with async_session_factory() as session:
        auth_session = await session.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == hash_refresh_token(refresh_token),
            ),
        )
    assert auth_session is not None
    assert auth_session.token_hash != refresh_token

    refresh_response = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    refreshed_data = refresh_response.json()
    rotated_refresh_token = refreshed_data["refresh_token"]

    assert refresh_response.status_code == 200
    assert rotated_refresh_token != refresh_token
    assert refreshed_data["refresh_token_expires_at"] == original_expiration

    reused_response = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert reused_response.status_code == 401

    logout_response = await unauthenticated_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": rotated_refresh_token},
    )
    after_logout_response = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": rotated_refresh_token},
    )

    assert logout_response.status_code == 204
    assert after_logout_response.status_code == 401


@pytest.mark.asyncio
async def test_expired_remembered_session_is_rejected(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    await activate_user(email)
    login_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    refresh_token = login_response.json()["refresh_token"]

    async with async_session_factory() as session:
        auth_session = await session.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == hash_refresh_token(refresh_token),
            ),
        )
        assert auth_session is not None
        auth_session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        await session.commit()

    response = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_only_revokes_the_current_device_session(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    await activate_user(email)

    first_login = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    second_login = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "remember_me": True},
    )
    first_token = first_login.json()["refresh_token"]
    second_token = second_login.json()["refresh_token"]

    await unauthenticated_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": first_token},
    )

    first_refresh = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first_token},
    )
    second_refresh = await unauthenticated_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": second_token},
    )

    assert first_refresh.status_code == 401
    assert second_refresh.status_code == 200


@pytest.mark.asyncio
async def test_pending_user_cannot_login(
    unauthenticated_client: AsyncClient,
    registered_user: tuple[str, str],
) -> None:
    email, password = registered_user
    await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Your account is waiting for admin approval"


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
    await activate_user(email)
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
