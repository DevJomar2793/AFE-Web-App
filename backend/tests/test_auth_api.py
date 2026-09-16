from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from httpx import AsyncClient
from pydantic import SecretStr
from sqlalchemy import delete, select

from app.auth import (
    create_access_token,
    hash_password,
    seed_initial_admin,
    verify_password,
)
from app.config import settings
from app.database import async_session_factory
from app.models import User


@pytest.fixture
async def created_user_emails() -> AsyncIterator[list[str]]:
    emails: list[str] = []
    yield emails

    if emails:
        async with async_session_factory() as session:
            await session.execute(delete(User).where(User.email.in_(emails)))
            await session.commit()


async def add_test_user(
    email: str,
    password: str,
    is_admin: bool = False,
) -> User:
    async with async_session_factory() as session:
        user = User(
            email=email,
            password_hash=hash_password(password),
            is_active=True,
            is_admin=is_admin,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest.mark.asyncio
async def test_login_returns_access_token(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    email = "__auth_login_test__@example.com"
    password = "correct-password"
    await add_test_user(email, password)
    created_user_emails.append(email)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": f"  {email.upper()}  ", "password": password},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["expires_in"] == 28_800
    assert isinstance(response.json()["access_token"], str)


@pytest.mark.asyncio
async def test_login_rejects_incorrect_password(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    email = "__auth_wrong_password_test__@example.com"
    await add_test_user(email, "correct-password")
    created_user_emails.append(email)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_get_me_requires_and_accepts_a_valid_token(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    email = "__auth_me_test__@example.com"
    user = await add_test_user(email, "correct-password")
    created_user_emails.append(email)

    missing_token_response = await client.get("/api/v1/auth/me")
    invalid_token_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-token"},
    )
    expired_token = jwt.encode(
        {"sub": str(user.id), "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret_key.get_secret_value(),
        algorithm="HS256",
    )
    expired_token_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    valid_token_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {create_access_token(user)}"},
    )

    assert missing_token_response.status_code == 401
    assert invalid_token_response.status_code == 401
    assert expired_token_response.status_code == 401
    assert valid_token_response.status_code == 200
    assert valid_token_response.json() == {
        "id": user.id,
        "email": email,
        "is_admin": False,
    }


@pytest.mark.asyncio
async def test_initial_admin_seed_only_creates_one_account(
    monkeypatch: pytest.MonkeyPatch,
    created_user_emails: list[str],
) -> None:
    email = "__initial_admin_seed_test__@example.com"
    password = "seed-password"
    monkeypatch.setattr(settings, "initial_admin_email", email)
    monkeypatch.setattr(settings, "initial_admin_password", SecretStr(password))
    created_user_emails.append(email)

    await seed_initial_admin()
    await seed_initial_admin()

    async with async_session_factory() as session:
        users = list(await session.scalars(select(User).where(User.email == email)))

    assert len(users) == 1
    assert users[0].is_active is True
    assert users[0].is_admin is True
    assert verify_password(password, users[0].password_hash)


@pytest.mark.asyncio
async def test_inventory_routes_remain_public_during_staged_rollout(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/v1/inventory/get-item")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_can_register_a_staff_account(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    admin_email = "__register_admin_test__@example.com"
    staff_email = "__register_staff_test__@example.com"
    admin = await add_test_user(admin_email, "admin-password", is_admin=True)
    created_user_emails.extend([admin_email, staff_email])

    response = await client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {create_access_token(admin)}"},
        json={"email": f"  {staff_email.upper()}  ", "password": "staff-password"},
    )

    assert response.status_code == 201
    assert response.json()["email"] == staff_email
    assert response.json()["is_admin"] is False


@pytest.mark.asyncio
async def test_registration_requires_an_admin_token(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    staff_email = "__register_non_admin_test__@example.com"
    staff = await add_test_user(staff_email, "staff-password")
    created_user_emails.append(staff_email)
    account = {"email": "new-staff@example.com", "password": "new-password"}

    missing_token_response = await client.post("/api/v1/auth/register", json=account)
    staff_token_response = await client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {create_access_token(staff)}"},
        json=account,
    )

    assert missing_token_response.status_code == 401
    assert staff_token_response.status_code == 403


@pytest.mark.asyncio
async def test_registration_rejects_duplicate_email_and_short_password(
    client: AsyncClient,
    created_user_emails: list[str],
) -> None:
    admin_email = "__register_duplicate_admin_test__@example.com"
    existing_email = "__register_existing_test__@example.com"
    admin = await add_test_user(admin_email, "admin-password", is_admin=True)
    await add_test_user(existing_email, "existing-password")
    created_user_emails.extend([admin_email, existing_email])
    headers = {"Authorization": f"Bearer {create_access_token(admin)}"}

    duplicate_response = await client.post(
        "/api/v1/auth/register",
        headers=headers,
        json={"email": existing_email, "password": "new-password"},
    )
    short_password_response = await client.post(
        "/api/v1/auth/register",
        headers=headers,
        json={"email": "short-password@example.com", "password": "short"},
    )

    assert duplicate_response.status_code == 409
    assert short_password_response.status_code == 422


@pytest.mark.asyncio
async def test_initial_admin_seed_promotes_an_existing_account(
    monkeypatch: pytest.MonkeyPatch,
    created_user_emails: list[str],
) -> None:
    email = "__initial_admin_promotion_test__@example.com"
    password = "existing-password"
    await add_test_user(email, password)
    created_user_emails.append(email)
    monkeypatch.setattr(settings, "initial_admin_email", email)
    monkeypatch.setattr(settings, "initial_admin_password", SecretStr("new-password"))

    await seed_initial_admin()

    async with async_session_factory() as session:
        user = await session.scalar(select(User).where(User.email == email))

    assert user is not None
    assert user.is_admin is True
    assert verify_password(password, user.password_hash)
