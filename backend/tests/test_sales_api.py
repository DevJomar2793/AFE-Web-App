import asyncio
from collections.abc import AsyncIterator
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.db.session import async_session_factory
from app.models import Inventory, InventoryStatus, Sale


@pytest.fixture
async def inventory_item() -> AsyncIterator[Inventory]:
    async with async_session_factory() as session:
        item = Inventory(
            item="__sale_inventory_test__",
            quantity=10,
            price=Decimal("250.00"),
            status=InventoryStatus.IN_STOCK,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)

    yield item

    async with async_session_factory() as session:
        await session.execute(delete(Sale).where(Sale.inventory_id == item.id))
        await session.execute(delete(Inventory).where(Inventory.id == item.id))
        await session.commit()


@pytest.mark.asyncio
async def test_create_sale_deducts_inventory(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 3,
            "customer_name": "  Maria Santos  ",
        },
    )

    assert response.status_code == 201
    sale_data = response.json()
    assert sale_data["inventory_id"] == inventory_item.id
    assert sale_data["item"] == {
        "id": inventory_item.id,
        "item": inventory_item.item,
    }
    assert sale_data["quantity"] == 3
    assert sale_data["customer_name"] == "Maria Santos"

    async with async_session_factory() as session:
        stored_sale = await session.get(Sale, sale_data["id"])
        stored_item = await session.get(Inventory, inventory_item.id)

    assert stored_sale is not None
    assert stored_item is not None
    assert stored_item.quantity == 7
    assert stored_item.status == InventoryStatus.IN_STOCK


@pytest.mark.asyncio
async def test_sale_of_remaining_stock_marks_item_out_of_stock(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": inventory_item.quantity,
            "customer_name": "Ana Reyes",
        },
    )

    assert response.status_code == 201

    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, inventory_item.id)

    assert stored_item is not None
    assert stored_item.quantity == 0
    assert stored_item.status == InventoryStatus.OUT_OF_STOCK


@pytest.mark.asyncio
async def test_list_sales_returns_newest_first_with_item_details(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    first_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 1,
            "customer_name": "First Customer",
        },
    )
    second_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 1,
            "customer_name": "Second Customer",
        },
    )
    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = await client.get("/api/v1/sales/get-sales")

    assert response.status_code == 200
    sales = response.json()
    sale_ids = [sale["id"] for sale in sales]
    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]
    assert sale_ids.index(second_id) < sale_ids.index(first_id)
    second_sale = next(sale for sale in sales if sale["id"] == second_id)
    assert second_sale["item"]["item"] == inventory_item.item


@pytest.mark.asyncio
async def test_create_sale_rejects_unknown_inventory_item(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": 2_147_483_647,
            "quantity": 1,
            "customer_name": "Maria Santos",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Inventory item not found"


@pytest.mark.asyncio
async def test_insufficient_stock_does_not_change_inventory(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": inventory_item.quantity + 1,
            "customer_name": "Maria Santos",
        },
    )

    assert response.status_code == 409

    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, inventory_item.id)
        sales = await session.scalars(
            select(Sale).where(Sale.inventory_id == inventory_item.id),
        )

    assert stored_item is not None
    assert stored_item.quantity == inventory_item.quantity
    assert list(sales.all()) == []


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"inventory_id": 1, "quantity": 0, "customer_name": "Customer"},
        {"inventory_id": 1, "quantity": -1, "customer_name": "Customer"},
        {"inventory_id": 1, "quantity": 1.5, "customer_name": "Customer"},
        {"inventory_id": 1, "quantity": 1, "customer_name": ""},
        {"inventory_id": 1, "quantity": 1, "customer_name": "   "},
        {"inventory_id": 1, "quantity": 1},
    ],
)
async def test_create_sale_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.post("/api/v1/sales/add-sales", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_concurrent_sales_cannot_oversell_inventory(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    sale_payload = {
        "inventory_id": inventory_item.id,
        "quantity": 6,
        "customer_name": "Concurrent Customer",
    }

    first_response, second_response = await asyncio.gather(
        client.post("/api/v1/sales/add-sales", json=sale_payload),
        client.post("/api/v1/sales/add-sales", json=sale_payload),
    )

    assert sorted([first_response.status_code, second_response.status_code]) == [
        201,
        409,
    ]

    async with async_session_factory() as session:
        stored_item = await session.get(Inventory, inventory_item.id)
        sales = await session.scalars(
            select(Sale).where(Sale.inventory_id == inventory_item.id),
        )

    assert stored_item is not None
    assert stored_item.quantity == 4
    assert len(list(sales.all())) == 1
