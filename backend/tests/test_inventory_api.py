from datetime import datetime
from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.db.session import async_session_factory, engine
from app.main import app
from app.models import Inventory, InventoryStatus


@pytest.mark.asyncio
async def test_create_inventory_item_api() -> None:
    created_ids: list[int] = []
    transport = ASGITransport(app=app)

    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/inventory",
                json={
                    "item": "  __create_inventory_item_test__  ",
                    "quantity": 5,
                    "price": "250.00",
                },
            )

            assert response.status_code == 201
            data = response.json()
            created_ids.append(data["id"])
            assert data["item"] == "__create_inventory_item_test__"
            assert data["quantity"] == 5
            assert data["price"] == "250.00"
            assert data["status"] == "in_stock"
            assert datetime.fromisoformat(data["created_at"])
            assert datetime.fromisoformat(data["updated_at"])

            empty_stock_response = await client.post(
                "/api/v1/inventory",
                json={
                    "item": "__empty_inventory_item_test__",
                    "quantity": 0,
                    "price": 0,
                },
            )
            assert empty_stock_response.status_code == 201
            empty_stock_data = empty_stock_response.json()
            created_ids.append(empty_stock_data["id"])
            assert empty_stock_data["status"] == "out_of_stock"

            invalid_payloads = [
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
            ]
            for payload in invalid_payloads:
                invalid_response = await client.post(
                    "/api/v1/inventory",
                    json=payload,
                )
                assert invalid_response.status_code == 422

        async with async_session_factory() as session:
            stored_inventory = await session.scalar(
                select(Inventory).where(Inventory.id == created_ids[0]),
            )
            assert stored_inventory is not None
            assert stored_inventory.item == "__create_inventory_item_test__"
            assert stored_inventory.quantity == 5
            assert stored_inventory.price == Decimal("250.00")
            assert stored_inventory.status == InventoryStatus.IN_STOCK
    finally:
        if created_ids:
            async with async_session_factory() as session:
                await session.execute(
                    delete(Inventory).where(Inventory.id.in_(created_ids)),
                )
                await session.commit()
        await engine.dispose()
