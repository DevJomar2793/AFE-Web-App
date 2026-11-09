from collections.abc import AsyncIterator
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete

from app.database import async_session_factory
from app.models import ActivityLog, Inventory, InventoryPriceHistory, Return, Sale


@pytest.fixture
async def activity_log_marker() -> AsyncIterator[str]:
    marker = f"activity-log-{uuid4()}"
    yield marker

    async with async_session_factory() as session:
        inventory_ids = await session.scalars(
            Inventory.__table__.select()
            .with_only_columns(Inventory.id)
            .where(Inventory.item.contains(marker)),
        )
        stored_inventory_ids = list(inventory_ids.all())

        await session.execute(
            delete(Sale).where(Sale.customer_name.contains(marker)),
        )
        if stored_inventory_ids:
            await session.execute(
                delete(Return).where(Return.inventory_id.in_(stored_inventory_ids)),
            )
            await session.execute(
                delete(InventoryPriceHistory).where(
                    InventoryPriceHistory.inventory_id.in_(stored_inventory_ids),
                ),
            )
            await session.execute(
                delete(Inventory).where(Inventory.id.in_(stored_inventory_ids)),
            )

        await session.execute(
            delete(ActivityLog).where(ActivityLog.affected_record.contains(marker)),
        )
        await session.commit()


@pytest.mark.asyncio
async def test_activity_logs_record_successful_admin_data_changes(
    client: AsyncClient,
    activity_log_marker: str,
) -> None:
    account_response = await client.get("/api/v1/auth/me")
    admin_email = account_response.json()["email"]

    inventory_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": activity_log_marker,
            "quantity": 10,
            "price": "250.00",
        },
    )
    assert inventory_response.status_code == 201
    inventory_id = inventory_response.json()["id"]

    update_inventory_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 12, "price": "275.00"},
    )
    assert update_inventory_response.status_code == 200

    sale_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_id,
            "quantity": 2,
            "customer_name": activity_log_marker,
        },
    )
    assert sale_response.status_code == 201
    sale = sale_response.json()

    update_sale_response = await client.patch(
        f"/api/v1/sales/{sale['id']}",
        json={
            "items": [
                {
                    "id": sale["items"][0]["id"],
                    "quantity": 1,
                    "price": "275.00",
                },
            ],
        },
    )
    assert update_sale_response.status_code == 200

    delete_sale_response = await client.delete(f"/api/v1/sales/{sale['id']}")
    assert delete_sale_response.status_code == 204

    return_response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": inventory_id,
            "quantity": 1,
            "customer_name": activity_log_marker,
            "reason": "Activity log test",
        },
    )
    assert return_response.status_code == 201

    logs_response = await client.get("/api/v1/activity-logs")
    assert logs_response.status_code == 200
    matching_logs = [
        log
        for log in logs_response.json()
        if activity_log_marker in log["affected_record"]
    ]

    assert [log["action"] for log in matching_logs] == [
        "added",
        "deleted",
        "edited",
        "added",
        "edited",
        "added",
    ]
    assert [log["id"] for log in matching_logs] == sorted(
        (log["id"] for log in matching_logs),
        reverse=True,
    )
    assert all(log["admin_email"] == admin_email for log in matching_logs)
    assert all(log["created_at"] for log in matching_logs)


@pytest.mark.asyncio
async def test_failed_data_change_does_not_create_activity_log(
    client: AsyncClient,
    activity_log_marker: str,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": 2_147_483_647,
            "quantity": 1,
            "customer_name": activity_log_marker,
        },
    )
    assert response.status_code == 404

    logs_response = await client.get("/api/v1/activity-logs")
    assert not any(
        activity_log_marker in log["affected_record"]
        for log in logs_response.json()
    )


@pytest.mark.asyncio
async def test_activity_logs_and_data_changes_require_authentication(
    unauthenticated_client: AsyncClient,
) -> None:
    logs_response = await unauthenticated_client.get("/api/v1/activity-logs")
    inventory_response = await unauthenticated_client.post(
        "/api/v1/inventory/add-stock",
        json={"item": "Unauthorized item", "quantity": 1, "price": 10},
    )
    sale_response = await unauthenticated_client.post(
        "/api/v1/sales/add-sales",
        json={"inventory_id": 1, "quantity": 1, "customer_name": "Unauthorized"},
    )

    assert logs_response.status_code == 401
    assert inventory_response.status_code == 401
    assert sale_response.status_code == 401
