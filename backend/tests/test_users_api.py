from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.database import async_session_factory
from app.models import ActivityLog, User
from app.security import create_access_token, hash_password


@pytest.fixture
async def pending_account(
    unauthenticated_client: AsyncClient,
) -> AsyncIterator[tuple[int, str, str]]:
    email = f"pending-{uuid4()}@example.com"
    password = "secure-password"
    response = await unauthenticated_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    user_id = response.json()["id"]

    yield user_id, email, password

    async with async_session_factory() as session:
        await session.execute(
            delete(ActivityLog).where(ActivityLog.affected_record.contains(email)),
        )
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()


@pytest.mark.asyncio
async def test_admin_lists_and_approves_pending_account(
    client: AsyncClient,
    unauthenticated_client: AsyncClient,
    pending_account: tuple[int, str, str],
) -> None:
    user_id, email, password = pending_account
    admin_response = await client.get("/api/v1/auth/me")
    admin_email = admin_response.json()["email"]

    pending_response = await client.get("/api/v1/users/pending")
    approve_response = await client.patch(f"/api/v1/users/{user_id}/approve")
    login_response = await unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    logs_response = await client.get("/api/v1/activity-logs")

    assert pending_response.status_code == 200
    pending_ids = [account["id"] for account in pending_response.json()]
    assert user_id in pending_ids
    assert approve_response.status_code == 200
    assert approve_response.json()["is_active"] is True
    assert approve_response.json()["is_admin"] is False
    assert login_response.status_code == 200

    approval_logs = [
        log
        for log in logs_response.json()
        if log["action"] == "approved" and email in log["affected_record"]
    ]
    assert len(approval_logs) == 1
    assert approval_logs[0]["admin_email"] == admin_email


@pytest.mark.asyncio
async def test_regular_user_cannot_manage_pending_accounts(
    unauthenticated_client: AsyncClient,
    pending_account: tuple[int, str, str],
) -> None:
    pending_user_id, _, _ = pending_account
    regular_user = User(
        email=f"regular-{uuid4()}@example.com",
        password_hash=hash_password("secure-password"),
        is_active=True,
        is_admin=False,
    )
    async with async_session_factory() as session:
        session.add(regular_user)
        await session.commit()
        await session.refresh(regular_user)

    headers = {"Authorization": f"Bearer {create_access_token(regular_user)}"}
    try:
        list_response = await unauthenticated_client.get(
            "/api/v1/users/pending",
            headers=headers,
        )
        approve_response = await unauthenticated_client.patch(
            f"/api/v1/users/{pending_user_id}/approve",
            headers=headers,
        )

        assert list_response.status_code == 403
        assert approve_response.status_code == 403
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(User).where(User.id == regular_user.id))
            await session.commit()


@pytest.mark.asyncio
async def test_approve_account_rejects_unknown_and_already_approved_users(
    client: AsyncClient,
    pending_account: tuple[int, str, str],
) -> None:
    user_id, _, _ = pending_account

    first_response = await client.patch(f"/api/v1/users/{user_id}/approve")
    second_response = await client.patch(f"/api/v1/users/{user_id}/approve")
    missing_response = await client.patch("/api/v1/users/2147483647/approve")

    assert first_response.status_code == 200
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Account is already approved"
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Account not found"
