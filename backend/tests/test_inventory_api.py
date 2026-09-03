from collections.abc import AsyncIterator
from datetime import datetime
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.db.session import async_session_factory, engine
from app.main import app
from app.models import Inventory, InventoryStatus


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def created_inventory_ids() -> AsyncIterator[list[int]]:
    inventory_ids: list[int] = []
    yield inventory_ids

    if inventory_ids:
        async with async_session_factory() as session:
            await session.execute(
                delete(Inventory).where(Inventory.id.in_(inventory_ids)),
            )
            await session.commit()


@pytest.fixture(scope="session", autouse=True)
async def dispose_database_engine() -> AsyncIterator[None]:
    yield
    await engine.dispose()


@pytest.mark.asyncio
async def test_create_inventory_item(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    response = await client.post(
        "/api/v1/inventory",
        json={
            "item": "  __create_inventory_item_test__  ",
            "quantity": 5,
            "price": "250.50",
        },
    )

    assert response.status_code == 201
    data = response.json()
    created_inventory_ids.append(data["id"])
    assert data["item"] == "__create_inventory_item_test__"
    assert data["quantity"] == 5
    assert data["price"] == "250.50"
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
    assert stored_inventory.price == Decimal("250.50")
    assert stored_inventory.status == InventoryStatus.IN_STOCK


@pytest.mark.asyncio
async def test_zero_quantity_defaults_to_out_of_stock(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    response = await client.post(
        "/api/v1/inventory",
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


@pytest.mark.asyncio
async def test_list_inventory_items(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory",
        json={
            "item": "__list_inventory_items_test__",
            "quantity": 3,
            "price": 125,
        },
    )
    assert create_response.status_code == 201
    created_id = create_response.json()["id"]
    created_inventory_ids.append(created_id)

    response = await client.get("/api/v1/inventory")

    assert response.status_code == 200
    inventory_items = response.json()
    returned_ids = [item["id"] for item in inventory_items]
    assert returned_ids == sorted(returned_ids)
    assert created_id in returned_ids


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"item": "", "quantity": 1, "price": 10},
        {"item": "   ", "quantity": 1, "price": 10},
        {"item": "Eggs", "quantity": -1, "price": 10},
        {"item": "Eggs", "quantity": 1.5, "price": 10},
        {"item": "Eggs", "quantity": 1, "price": -1},
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
    response = await client.post("/api/v1/inventory", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_legacy_inventory_routes_remain_available(
    client: AsyncClient,
    created_inventory_ids: list[int],
) -> None:
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": "__legacy_inventory_routes_test__",
            "quantity": 2,
            "price": 100,
        },
    )
    assert create_response.status_code == 201
    created_id = create_response.json()["id"]
    created_inventory_ids.append(created_id)

    list_response = await client.get("/api/v1/inventory/all-items")
    assert list_response.status_code == 200
    assert created_id in [item["id"] for item in list_response.json()]


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "connected"
