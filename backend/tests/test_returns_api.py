import asyncio
from collections.abc import AsyncIterator
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.db.session import async_session_factory
from app.models import Inventory, InventoryStatus, Return


@pytest.fixture
async def return_inventory_item() -> AsyncIterator[Inventory]:
    async with async_session_factory() as session:
        item = Inventory(
            item="__return_inventory_test__",
            quantity=10,
            price=Decimal("250.00"),
            status=InventoryStatus.IN_STOCK,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)

    yield item

    async with async_session_factory() as session:
        await session.execute(
            delete(Return).where(Return.inventory_id == item.id),
        )
        await session.execute(delete(Inventory).where(Inventory.id == item.id))
        await session.commit()


@pytest.mark.asyncio
async def test_create_return_tracks_returned_units_without_changing_quantity(
    client: AsyncClient,
    return_inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": return_inventory_item.id,
            "quantity": 3,
            "customer_name": "  Maria Santos  ",
            "reason": "  Damaged tray  ",
        },
    )

    assert response.status_code == 201
    return_data = response.json()
    assert return_data["inventory_id"] == return_inventory_item.id
    assert return_data["item"] == {
        "id": return_inventory_item.id,
        "item": return_inventory_item.item,
    }
    assert return_data["quantity"] == 3
    assert return_data["customer_name"] == "Maria Santos"
    assert return_data["reason"] == "Damaged tray"
    assert return_data["created_at"]
    assert return_data["updated_at"]

    async with async_session_factory() as session:
        stored_return = await session.get(Return, return_data["id"])
        stored_item = await session.get(Inventory, return_inventory_item.id)

    assert stored_return is not None
    assert stored_return.reason == "Damaged tray"
    assert stored_item is not None
    assert stored_item.quantity == 10
    assert stored_item.returns_count == 3
    assert stored_item.status == InventoryStatus.IN_STOCK


@pytest.mark.asyncio
async def test_return_does_not_change_out_of_stock_quantity_or_status(
    client: AsyncClient,
    return_inventory_item: Inventory,
) -> None:
    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, return_inventory_item.id)
        assert stored_item is not None
        stored_item.quantity = 0
        stored_item.status = InventoryStatus.OUT_OF_STOCK
        await session.commit()

    response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": return_inventory_item.id,
            "quantity": 1,
            "customer_name": "Ana Reyes",
            "reason": "Wrong size",
        },
    )

    assert response.status_code == 201
    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, return_inventory_item.id)

    assert stored_item is not None
    assert stored_item.quantity == 0
    assert stored_item.returns_count == 1
    assert stored_item.status == InventoryStatus.OUT_OF_STOCK


@pytest.mark.asyncio
async def test_return_preserves_low_stock_status(
    client: AsyncClient,
    return_inventory_item: Inventory,
) -> None:
    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, return_inventory_item.id)
        assert stored_item is not None
        stored_item.status = InventoryStatus.LOW_STOCK
        await session.commit()

    response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": return_inventory_item.id,
            "quantity": 1,
            "customer_name": "Ana Reyes",
            "reason": "Changed mind",
        },
    )

    assert response.status_code == 201
    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, return_inventory_item.id)

    assert stored_item is not None
    assert stored_item.quantity == 10
    assert stored_item.returns_count == 1
    assert stored_item.status == InventoryStatus.LOW_STOCK


@pytest.mark.asyncio
async def test_list_returns_returns_newest_first_with_item_details(
    client: AsyncClient,
    return_inventory_item: Inventory,
) -> None:
    first_response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": return_inventory_item.id,
            "quantity": 1,
            "customer_name": "First Customer",
            "reason": "First reason",
        },
    )
    second_response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": return_inventory_item.id,
            "quantity": 2,
            "customer_name": "Second Customer",
            "reason": "Second reason",
        },
    )
    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = await client.get("/api/v1/returns/get-returns")

    assert response.status_code == 200
    returns = response.json()
    return_ids = [inventory_return["id"] for inventory_return in returns]
    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]
    assert return_ids.index(second_id) < return_ids.index(first_id)
    second_return = next(
        inventory_return
        for inventory_return in returns
        if inventory_return["id"] == second_id
    )
    assert second_return["item"]["item"] == return_inventory_item.item
    assert second_return["reason"] == "Second reason"


@pytest.mark.asyncio
async def test_create_return_rejects_unknown_inventory_item(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/returns/add-returns",
        json={
            "inventory_id": 2_147_483_647,
            "quantity": 1,
            "customer_name": "Maria Santos",
            "reason": "Damaged item",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Inventory item not found"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {
            "inventory_id": 1,
            "quantity": 0,
            "customer_name": "Customer",
            "reason": "Reason",
        },
        {
            "inventory_id": 1,
            "quantity": -1,
            "customer_name": "Customer",
            "reason": "Reason",
        },
        {
            "inventory_id": 1,
            "quantity": 1.5,
            "customer_name": "Customer",
            "reason": "Reason",
        },
        {
            "inventory_id": 1,
            "quantity": 1,
            "customer_name": "   ",
            "reason": "Reason",
        },
        {
            "inventory_id": 1,
            "quantity": 1,
            "customer_name": "Customer",
            "reason": "   ",
        },
        {
            "inventory_id": 1,
            "quantity": 1,
            "customer_name": "Customer",
        },
        {
            "inventory_id": 1,
            "quantity": 1,
            "customer_name": "x" * 256,
            "reason": "Reason",
        },
        {
            "inventory_id": 1,
            "quantity": 1,
            "customer_name": "Customer",
            "reason": "x" * 256,
        },
    ],
)
async def test_create_return_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.post("/api/v1/returns/add-returns", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_concurrent_returns_do_not_lose_inventory_updates(
    client: AsyncClient,
    return_inventory_item: Inventory,
) -> None:
    return_payload = {
        "inventory_id": return_inventory_item.id,
        "quantity": 6,
        "customer_name": "Concurrent Customer",
        "reason": "Concurrent return",
    }

    first_response, second_response = await asyncio.gather(
        client.post("/api/v1/returns/add-returns", json=return_payload),
        client.post("/api/v1/returns/add-returns", json=return_payload),
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, return_inventory_item.id)
        inventory_returns = await session.scalars(
            select(Return).where(Return.inventory_id == return_inventory_item.id),
        )

    assert stored_item is not None
    assert stored_item.quantity == 10
    assert stored_item.returns_count == 12
    assert len(list(inventory_returns.all())) == 2
