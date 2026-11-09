from collections.abc import AsyncIterator
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.database import async_session_factory
from app.models import (
    ActivityLog,
    Inventory,
    InventoryPriceHistory,
    InventoryStatus,
    Return,
    User,
)
from app.security import create_access_token, hash_password


@pytest.fixture
async def created_inventory_ids() -> AsyncIterator[list[int]]:
    inventory_ids: list[int] = []
    yield inventory_ids

    if inventory_ids:
        async with async_session_factory() as session:
            await session.execute(
                delete(InventoryPriceHistory).where(
                    InventoryPriceHistory.inventory_id.in_(inventory_ids),
                ),
            )
            await session.execute(
                delete(Inventory).where(Inventory.id.in_(inventory_ids)),
            )
            await session.commit()

@pytest.mark.asyncio
async def test_create_inventory_item(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "  __create_inventory_item_test__  ",
            "quantity": 5,
            "price": "250.50",
            "wholesale_price": "225.50",
        },
    )

    assert response.status_code == 201
    data = response.json()
    created_inventory_ids.append(data["id"])
    assert data["item"] == "__create_inventory_item_test__"
    assert data["quantity"] == 5
    assert data["returns_count"] == 0
    assert data["price"] == "250.50"
    assert data["wholesale_price"] == "225.50"
    assert data["category"] == "eggs"
    assert data["oil_size"] is None
    assert data["status"] == "in_stock"
    assert datetime.fromisoformat(data["created_at"])
    assert datetime.fromisoformat(data["updated_at"])

    async with async_session_factory() as session:
        stored_inventory = await session.scalar(
            select(Inventory).where(Inventory.id == data["id"]),
        )

    assert stored_inventory is not None
    assert stored_inventory.item == "__create_inventory_item_test__"
    assert stored_inventory.quantity == 5
    assert stored_inventory.returns_count == 0
    assert stored_inventory.price == Decimal("250.50")
    assert stored_inventory.wholesale_price == Decimal("225.50")
    assert stored_inventory.category == "eggs"
    assert stored_inventory.oil_size is None
    assert stored_inventory.status == InventoryStatus.IN_STOCK

    history_response = await client.get("/api/v1/inventory/price-history")
    initial_record = next(
        record
        for record in history_response.json()
        if record["inventory_id"] == data["id"]
    )
    assert initial_record["event_type"] == "initial"
    assert initial_record["quantity"] == 5
    assert initial_record["previous_purchase_cost"] is None
    assert initial_record["new_purchase_cost"] == "0.00"
    assert initial_record["price_difference"] is None
    assert initial_record["percentage_change"] is None
    assert initial_record["change_direction"] == "initial"


@pytest.mark.asyncio
async def test_create_oil_requires_a_supported_size(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    missing_size_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__oil_without_size_test__",
            "quantity": 5,
            "price": 100,
            "category": "oil",
        },
    )
    invalid_size_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__oil_invalid_size_test__",
            "quantity": 5,
            "price": 100,
            "category": "oil",
            "oil_size": "1L",
        },
    )
    valid_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__oil_350ml_test__",
            "quantity": 5,
            "price": 100,
            "category": "oil",
            "oil_size": "350ml",
        },
    )

    assert missing_size_response.status_code == 422
    assert invalid_size_response.status_code == 422
    assert valid_response.status_code == 201
    created_inventory_ids.append(valid_response.json()["id"])
    assert valid_response.json()["category"] == "oil"
    assert valid_response.json()["oil_size"] == "350ml"


@pytest.mark.asyncio
async def test_zero_quantity_defaults_to_out_of_stock(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__empty_inventory_item_test__",
            "quantity": 0,
            "price": 0,
        },
    )

    assert response.status_code == 201
    data = response.json()
    created_inventory_ids.append(data["id"])
    assert data["status"] == "out_of_stock"
    assert data["wholesale_price"] is None


@pytest.mark.asyncio
async def test_update_inventory_item_quantity_and_price(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__update_inventory_item_test__",
            "quantity": 5,
            "price": 250,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 12, "price": "275.50"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == inventory_id
    assert data["item"] == "__update_inventory_item_test__"
    assert data["quantity"] == 12
    assert data["price"] == "275.50"
    assert data["status"] == "in_stock"

    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_id)

    assert stored_inventory is not None
    assert stored_inventory.quantity == 12
    assert stored_inventory.price == Decimal("275.50")


@pytest.mark.asyncio
async def test_admin_deletes_unused_inventory_item_and_records_activity(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__delete_inventory_item_test__",
            "quantity": 8,
            "price": 250,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)
    admin_email = (await client.get("/api/v1/auth/me")).json()["email"]

    response = await client.delete(f"/api/v1/inventory/{inventory_id}")

    assert response.status_code == 204
    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_id)
        activity_log = await session.scalar(
            select(ActivityLog).where(
                ActivityLog.action == "deleted",
                ActivityLog.affected_record
                == "Inventory — __delete_inventory_item_test__",
                ActivityLog.admin_email == admin_email,
            ),
        )
        price_history = await session.scalar(
            select(InventoryPriceHistory).where(
                InventoryPriceHistory.product_name
                == "__delete_inventory_item_test__",
            ),
        )

    assert stored_inventory is None
    assert activity_log is not None
    assert price_history is not None
    assert price_history.inventory_id is None

    async with async_session_factory() as session:
        await session.execute(
            delete(InventoryPriceHistory).where(
                InventoryPriceHistory.id == price_history.id,
            ),
        )
        await session.commit()


@pytest.mark.asyncio
async def test_inventory_updates_record_price_history(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__price_history_update_test__",
            "quantity": 5,
            "price": 150,
            "purchase_cost": 100,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    stock_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 8, "price": 150, "purchase_cost": 120},
    )
    price_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 8, "price": 150, "purchase_cost": 90},
    )
    unchanged_price_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 9, "price": 150, "purchase_cost": 90},
    )
    no_op_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 9, "price": 150, "purchase_cost": 90},
    )

    assert stock_response.status_code == 200
    assert price_response.status_code == 200
    assert unchanged_price_response.status_code == 200
    assert no_op_response.status_code == 200

    history_response = await client.get("/api/v1/inventory/price-history")
    records = [
        record
        for record in history_response.json()
        if record["inventory_id"] == inventory_id
    ]

    assert len(records) == 4
    assert [record["event_type"] for record in records] == [
        "stock_added",
        "price_update",
        "stock_added",
        "initial",
    ]
    assert records[0]["quantity"] == 9
    assert records[0]["price_difference"] == "0.00"
    assert records[0]["percentage_change"] == "0.00"
    assert records[0]["change_direction"] == "unchanged"
    assert records[1]["previous_purchase_cost"] == "120.00"
    assert records[1]["new_purchase_cost"] == "90.00"
    assert records[1]["price_difference"] == "-30.00"
    assert records[1]["percentage_change"] == "-25.00"
    assert records[1]["change_direction"] == "decreased"
    assert records[2]["quantity"] == 8
    assert records[2]["previous_purchase_cost"] == "100.00"
    assert records[2]["new_purchase_cost"] == "120.00"
    assert records[2]["price_difference"] == "20.00"
    assert records[2]["percentage_change"] == "20.00"
    assert records[2]["change_direction"] == "increased"


@pytest.mark.asyncio
async def test_zero_previous_price_has_no_percentage_change(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__zero_price_history_test__",
            "quantity": 1,
            "price": 10,
            "purchase_cost": 0,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 1, "price": 10, "purchase_cost": 50},
    )
    history_response = await client.get("/api/v1/inventory/price-history")
    updated_record = next(
        record
        for record in history_response.json()
        if record["inventory_id"] == inventory_id
        and record["event_type"] == "price_update"
    )

    assert updated_record["price_difference"] == "50.00"
    assert updated_record["percentage_change"] is None
    assert updated_record["change_direction"] == "increased"


@pytest.mark.asyncio
async def test_price_history_requires_authentication(
    unauthenticated_client: AsyncClient,
) -> None:
    response = await unauthenticated_client.get(
        "/api/v1/inventory/price-history",
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_inventory_with_sale_history_cannot_be_deleted(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__delete_sale_history_test__",
            "quantity": 5,
            "price": 100,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)
    sale_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_id,
            "quantity": 1,
            "customer_name": "Deletion Test",
        },
    )
    sale_id = sale_response.json()["id"]

    response = await client.delete(f"/api/v1/inventory/{inventory_id}")

    assert response.status_code == 409
    assert "sale or return history" in response.json()["detail"]
    async with async_session_factory() as session:
        assert await session.get(Inventory, inventory_id) is not None

    await client.delete(f"/api/v1/sales/{sale_id}")


@pytest.mark.asyncio
async def test_inventory_with_return_history_cannot_be_deleted(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__delete_return_history_test__",
            "quantity": 5,
            "price": 100,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)
    return_response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": inventory_id,
            "quantity": 1,
            "customer_name": "Deletion Test",
            "reason": "Damaged item",
        },
    )
    return_id = return_response.json()["id"]

    response = await client.delete(f"/api/v1/inventory/{inventory_id}")

    assert response.status_code == 409
    async with async_session_factory() as session:
        assert await session.get(Inventory, inventory_id) is not None
        await session.execute(delete(Return).where(Return.id == return_id))
        await session.commit()


@pytest.mark.asyncio
async def test_regular_user_cannot_delete_inventory_item(
    client: AsyncClient,
    unauthenticated_client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    unauthenticated_response = await unauthenticated_client.delete(
        "/api/v1/inventory/2147483647",
        headers={"Authorization": "Bearer invalid-token"},
    )
    missing_response = await client.delete("/api/v1/inventory/2147483647")
    assert unauthenticated_response.status_code == 401
    assert missing_response.status_code == 404

    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__admin_delete_only_test__",
            "quantity": 1,
            "price": 100,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)
    regular_user = User(
        email=f"inventory-delete-{uuid4()}@example.com",
        password_hash=hash_password("secure-password"),
        is_active=True,
        is_admin=False,
    )
    async with async_session_factory() as session:
        session.add(regular_user)
        await session.commit()
        await session.refresh(regular_user)

    try:
        response = await unauthenticated_client.delete(
            f"/api/v1/inventory/{inventory_id}",
            headers={
                "Authorization": f"Bearer {create_access_token(regular_user)}",
            },
        )
        assert response.status_code == 403
        async with async_session_factory() as session:
            assert await session.get(Inventory, inventory_id) is not None
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(User).where(User.id == regular_user.id))
            await session.commit()


@pytest.mark.asyncio
async def test_update_inventory_item_wholesale_price_can_be_set_and_cleared(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__wholesale_price_test__",
            "quantity": 5,
            "price": 250,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    set_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 5, "price": 250, "wholesale_price": "220.50"},
    )
    clear_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 5, "price": 250, "wholesale_price": None},
    )

    assert set_response.status_code == 200
    assert set_response.json()["wholesale_price"] == "220.50"
    assert clear_response.status_code == 200
    assert clear_response.json()["wholesale_price"] is None

    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_id)

    assert stored_inventory is not None
    assert stored_inventory.wholesale_price is None


@pytest.mark.asyncio
async def test_update_inventory_item_adjusts_out_of_stock_status(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__update_inventory_status_test__",
            "quantity": 2,
            "price": 100,
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    empty_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 0, "price": 100},
    )
    restored_response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 3, "price": 100},
    )

    assert empty_response.status_code == 200
    assert empty_response.json()["status"] == "out_of_stock"
    assert restored_response.status_code == 200
    assert restored_response.json()["status"] == "in_stock"


@pytest.mark.asyncio
async def test_update_inventory_item_preserves_low_stock_status(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__update_low_stock_test__",
            "quantity": 2,
            "price": 100,
            "status": "low_stock",
        },
    )
    inventory_id = create_response.json()["id"]
    created_inventory_ids.append(inventory_id)

    response = await client.patch(
        f"/api/v1/inventory/{inventory_id}",
        json={"quantity": 4, "price": 125},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "low_stock"


@pytest.mark.asyncio
async def test_update_inventory_item_rejects_unknown_item(
    client: AsyncClient,
) -> None:
    response = await client.patch(
        "/api/v1/inventory/2147483647",
        json={"quantity": 1, "price": 100},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Inventory item not found"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"quantity": -1, "price": 10},
        {"quantity": 1.5, "price": 10},
        {"quantity": 1, "price": -1},
        {"quantity": 1, "price": 10.123},
        {"quantity": 1, "price": 10_000_000_000},
        {"quantity": 1},
        {"price": 10},
        {"quantity": 1, "price": 10, "item": "Changed"},
        {"quantity": 1, "price": 10, "wholesale_price": -1},
        {"quantity": 1, "price": 10, "wholesale_price": 10.123},
    ],
)
async def test_update_inventory_item_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.patch(
        "/api/v1/inventory/1",
        json=payload,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_inventory_items(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__list_inventory_items_test__",
            "quantity": 3,
            "price": 125,
        },
    )
    assert create_response.status_code == 201
    created_id = create_response.json()["id"]
    created_inventory_ids.append(created_id)

    response = await client.get("/api/v1/inventory/get-item")

    assert response.status_code == 200
    inventory_items = response.json()
    returned_ids = [item["id"] for item in inventory_items]
    assert returned_ids == sorted(returned_ids)
    created_item = next(item for item in inventory_items if item["id"] == created_id)
    assert created_item["returns_count"] == 0


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"item": "", "quantity": 1, "price": 10},
        {"item": "   ", "quantity": 1, "price": 10},
        {"item": "Eggs", "quantity": -1, "price": 10},
        {"item": "Eggs", "quantity": 1.5, "price": 10},
        {"item": "Eggs", "quantity": 1, "price": -1},
        {"item": "Eggs", "quantity": 1, "price": 10, "wholesale_price": -1},
        {
            "item": "Eggs",
            "quantity": 1,
            "price": 10,
            "wholesale_price": 10.123,
        },
        {
            "item": "Eggs",
            "quantity": 0,
            "price": 10,
            "status": "in_stock",
        },
        {
            "item": "Eggs",
            "quantity": 1,
            "price": 10,
            "status": "out_of_stock",
        },
    ],
)
async def test_create_inventory_item_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.post("/api/v1/inventory/add-stock", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "connected"


@pytest.mark.asyncio
async def test_cors_allows_local_frontend(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/inventory/add-stock",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "DELETE" in response.headers["access-control-allow-methods"]


@pytest.mark.asyncio
async def test_cors_allows_expo_web(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/inventory/add-stock",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:8081"
    )


@pytest.mark.asyncio
async def test_cors_rejects_unknown_origin(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/inventory/add-stock",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers
