import asyncio
from collections.abc import AsyncIterator
from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select

from app.database import async_session_factory
from app.models import (
    Customer,
    Inventory,
    InventoryStatus,
    OfficialReceipt,
    Sale,
    SaleItem,
)


@pytest.fixture
async def inventory_item() -> AsyncIterator[Inventory]:
    async with async_session_factory() as session:
        item = Inventory(
            item="__sale_inventory_test__",
            quantity=10,
            price=Decimal("250.00"),
            wholesale_price=Decimal("200.00"),
            status=InventoryStatus.IN_STOCK,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)

    yield item
    await remove_inventory_test_data(item.id)


@pytest.fixture
async def second_inventory_item() -> AsyncIterator[Inventory]:
    async with async_session_factory() as session:
        item = Inventory(
            item="__second_sale_inventory_test__",
            quantity=20,
            price=Decimal("180.00"),
            wholesale_price=Decimal("150.00"),
            status=InventoryStatus.LOW_STOCK,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)

    yield item
    await remove_inventory_test_data(item.id)


async def remove_inventory_test_data(inventory_id: int) -> None:
    async with async_session_factory() as session:
        sale_ids = await session.scalars(
            select(SaleItem.sale_id).where(SaleItem.inventory_id == inventory_id),
        )
        stored_sale_ids = list(sale_ids.all())
        if stored_sale_ids:
            await session.execute(delete(Sale).where(Sale.id.in_(stored_sale_ids)))
        await session.execute(delete(Inventory).where(Inventory.id == inventory_id))
        await session.commit()


@pytest.fixture
async def sale_customer() -> AsyncIterator[Customer]:
    customer = Customer(
        name="Receipt Customer",
        number=str(uuid4().int)[-11:],
        address="123 Test Street",
        landmark="Near Test Market",
    )
    async with async_session_factory() as session:
        session.add(customer)
        await session.commit()
        await session.refresh(customer)

    yield customer

    async with async_session_factory() as session:
        stored_customer = await session.get(Customer, customer.id)
        if stored_customer is not None:
            await session.delete(stored_customer)
            await session.commit()


@pytest.mark.asyncio
async def test_create_sale_with_official_receipt_saves_one_report(
    client: AsyncClient,
    inventory_item: Inventory,
    sale_customer: Customer,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_id": sale_customer.id,
            "customer_name": "Client value is replaced by the saved customer",
            "generate_official_receipt": True,
            "items": [{"inventory_id": inventory_item.id, "quantity": 2}],
        },
    )

    assert response.status_code == 201
    sale_data = response.json()
    assert sale_data["customer_name"] == sale_customer.name
    assert sale_data["customer_number"] == sale_customer.number
    assert sale_data["has_official_receipt"] is True

    receipt_response = await client.get(
        f"/api/v1/sales/{sale_data['id']}/official-receipt",
    )
    assert receipt_response.status_code == 200
    receipt_data = receipt_response.json()
    assert receipt_data["sale_id"] == sale_data["id"]
    assert receipt_data["customer_number"] == sale_customer.number
    assert receipt_data["customer_address"] == sale_customer.address
    assert receipt_data["items"][0]["item_name"] == inventory_item.item
    assert receipt_data["items"][0]["quantity"] == 2
    assert Decimal(receipt_data["items"][0]["subtotal"]) == Decimal("500.00")
    assert Decimal(receipt_data["total_amount"]) == Decimal("500.00")

    repeated_response = await client.post(
        f"/api/v1/sales/{sale_data['id']}/official-receipt",
    )
    assert repeated_response.status_code == 200
    assert repeated_response.json()["id"] == receipt_data["id"]

    async with async_session_factory() as session:
        receipts = list(
            (
                await session.scalars(
                    select(OfficialReceipt).where(
                        OfficialReceipt.sale_id == sale_data["id"],
                    ),
                )
            ).all(),
        )
    assert len(receipts) == 1


@pytest.mark.asyncio
async def test_edit_sale_updates_saved_official_receipt(
    client: AsyncClient,
    inventory_item: Inventory,
    sale_customer: Customer,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_id": sale_customer.id,
            "customer_name": sale_customer.name,
            "generate_official_receipt": True,
            "items": [{"inventory_id": inventory_item.id, "quantity": 1}],
        },
    )
    assert create_response.status_code == 201
    sale_data = create_response.json()

    update_response = await client.patch(
        f"/api/v1/sales/{sale_data['id']}",
        json={"items": [{"id": sale_data["items"][0]["id"], "quantity": 3}]},
    )
    assert update_response.status_code == 200

    receipt_response = await client.get(
        f"/api/v1/sales/{sale_data['id']}/official-receipt",
    )
    assert receipt_response.status_code == 200
    receipt_data = receipt_response.json()
    assert receipt_data["items"][0]["quantity"] == 3
    assert Decimal(receipt_data["items"][0]["unit_price"]) == Decimal("250.00")


@pytest.mark.asyncio
async def test_generate_receipt_for_existing_sale_is_idempotent(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 1,
            "customer_name": "Legacy Customer",
        },
    )
    assert create_response.status_code == 201
    sale_data = create_response.json()
    assert sale_data["has_official_receipt"] is False

    first_response = await client.post(
        f"/api/v1/sales/{sale_data['id']}/official-receipt",
    )
    second_response = await client.post(
        f"/api/v1/sales/{sale_data['id']}/official-receipt",
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_response.json()["id"] == second_response.json()["id"]
    assert first_response.json()["customer_number"] is None


@pytest.mark.asyncio
async def test_create_single_item_sale_transaction(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 2,
            "customer_name": "  Maria Santos  ",
        },
    )

    assert response.status_code == 201
    sale_data = response.json()
    assert sale_data["customer_name"] == "Maria Santos"
    assert len(sale_data["items"]) == 1
    assert sale_data["items"][0]["inventory_id"] == inventory_item.id
    assert sale_data["items"][0]["quantity"] == 2
    assert Decimal(sale_data["items"][0]["price"]) == Decimal("250.00")

    async with async_session_factory() as session:
        stored_sale = await session.get(Sale, sale_data["id"])
        stored_item = await session.get(Inventory, inventory_item.id)
        sale_items = await session.scalars(
            select(SaleItem).where(SaleItem.sale_id == sale_data["id"]),
        )

    assert stored_sale is not None
    assert stored_item is not None
    assert stored_item.quantity == 8
    assert len(list(sale_items.all())) == 1


@pytest.mark.asyncio
async def test_create_multi_item_purchase_creates_one_sale(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "John",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 2},
                {"inventory_id": second_inventory_item.id, "quantity": 3},
            ],
        },
    )

    assert response.status_code == 201
    sale_data = response.json()
    assert sale_data["customer_name"] == "John"
    assert len(sale_data["items"]) == 2

    async with async_session_factory() as session:
        sales = list((await session.scalars(select(Sale))).all())
        sale_items = list(
            (
                await session.scalars(
                    select(SaleItem).where(SaleItem.sale_id == sale_data["id"]),
                )
            ).all(),
        )
        first_inventory = await session.get(Inventory, inventory_item.id)
        second_inventory = await session.get(Inventory, second_inventory_item.id)

    matching_sales = [sale for sale in sales if sale.id == sale_data["id"]]
    assert len(matching_sales) == 1
    assert len(sale_items) == 2
    assert first_inventory is not None
    assert first_inventory.quantity == 8
    assert second_inventory is not None
    assert second_inventory.quantity == 17


@pytest.mark.asyncio
async def test_create_sale_uses_wholesale_price_per_item(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Wholesale Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 6},
                {"inventory_id": second_inventory_item.id, "quantity": 2},
            ],
        },
    )

    assert response.status_code == 201
    items_by_inventory_id = {
        item["inventory_id"]: item for item in response.json()["items"]
    }
    assert Decimal(items_by_inventory_id[inventory_item.id]["price"]) == Decimal(
        "200.00",
    )
    assert Decimal(
        items_by_inventory_id[second_inventory_item.id]["price"],
    ) == Decimal("180.00")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("oil_size", "wholesale_minimum"),
    [("1.5L", 3), ("350ml", 5)],
)
async def test_oil_wholesale_price_starts_at_size_threshold(
    client: AsyncClient,
    oil_size: str,
    wholesale_minimum: int,
) -> None:
    async with async_session_factory() as session:
        item = Inventory(
            item=f"__oil_{oil_size}_wholesale_test__",
            quantity=20,
            price=Decimal("100.00"),
            wholesale_price=Decimal("80.00"),
            category="oil",
            oil_size=oil_size,
            status=InventoryStatus.IN_STOCK,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)

    try:
        retail_response = await client.post(
            "/api/v1/sales/add-sales",
            json={
                "inventory_id": item.id,
                "quantity": wholesale_minimum - 1,
                "customer_name": "Retail Customer",
            },
        )
        wholesale_response = await client.post(
            "/api/v1/sales/add-sales",
            json={
                "inventory_id": item.id,
                "quantity": wholesale_minimum,
                "customer_name": "Wholesale Customer",
            },
        )

        assert retail_response.status_code == 201
        assert wholesale_response.status_code == 201
        assert Decimal(retail_response.json()["items"][0]["price"]) == Decimal(
            "100.00",
        )
        assert Decimal(wholesale_response.json()["items"][0]["price"]) == Decimal(
            "80.00",
        )
    finally:
        await remove_inventory_test_data(item.id)


@pytest.mark.asyncio
async def test_batch_failure_rolls_back_sale_and_inventory(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 2},
                {"inventory_id": second_inventory_item.id, "quantity": 21},
            ],
        },
    )

    assert response.status_code == 409
    async with async_session_factory() as session:
        first_inventory = await session.get(Inventory, inventory_item.id)
        second_inventory = await session.get(Inventory, second_inventory_item.id)
        sale_items = list(
            (
                await session.scalars(
                    select(SaleItem).where(
                        SaleItem.inventory_id.in_(
                            [inventory_item.id, second_inventory_item.id],
                        ),
                    ),
                )
            ).all(),
        )

    assert first_inventory is not None
    assert first_inventory.quantity == 10
    assert second_inventory is not None
    assert second_inventory.quantity == 20
    assert sale_items == []


@pytest.mark.asyncio
async def test_batch_rejects_missing_and_duplicate_items(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    missing_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 1},
                {"inventory_id": 2_147_483_647, "quantity": 1},
            ],
        },
    )
    duplicate_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 1},
                {"inventory_id": inventory_item.id, "quantity": 2},
            ],
        },
    )

    assert missing_response.status_code == 404
    assert duplicate_response.status_code == 422


@pytest.mark.asyncio
async def test_get_sales_returns_one_transaction_with_all_items(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 1},
                {"inventory_id": second_inventory_item.id, "quantity": 2},
            ],
        },
    )

    response = await client.get("/api/v1/sales/get-sales")

    assert response.status_code == 200
    matching_sales = [
        sale for sale in response.json() if sale["id"] == create_response.json()["id"]
    ]
    assert len(matching_sales) == 1
    assert len(matching_sales[0]["items"]) == 2


@pytest.mark.asyncio
async def test_update_sale_adjusts_quantities_and_recalculates_prices(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 2},
                {"inventory_id": second_inventory_item.id, "quantity": 3},
            ],
        },
    )
    sale_data = create_response.json()
    items_by_inventory_id = {
        item["inventory_id"]: item for item in sale_data["items"]
    }

    response = await client.patch(
        f"/api/v1/sales/{sale_data['id']}",
        json={
            "items": [
                {
                    "id": items_by_inventory_id[inventory_item.id]["id"],
                    "quantity": 4,
                },
                {
                    "id": items_by_inventory_id[second_inventory_item.id]["id"],
                    "quantity": 1,
                },
            ],
        },
    )

    assert response.status_code == 200
    updated_items = {
        item["inventory_id"]: item for item in response.json()["items"]
    }
    assert updated_items[inventory_item.id]["quantity"] == 4
    assert updated_items[second_inventory_item.id]["quantity"] == 1
    assert Decimal(updated_items[inventory_item.id]["price"]) == Decimal("250.00")
    assert Decimal(updated_items[second_inventory_item.id]["price"]) == Decimal(
        "180.00",
    )

    async with async_session_factory() as session:
        first_inventory = await session.get(Inventory, inventory_item.id)
        second_inventory = await session.get(Inventory, second_inventory_item.id)

    assert first_inventory is not None
    assert first_inventory.quantity == 6
    assert first_inventory.price == Decimal("250.00")
    assert second_inventory is not None
    assert second_inventory.quantity == 19
    assert second_inventory.price == Decimal("180.00")


@pytest.mark.asyncio
async def test_update_sale_rejects_changed_item_list(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales",
        json={
            "inventory_id": inventory_item.id,
            "quantity": 2,
            "customer_name": "Customer",
        },
    )
    sale_data = create_response.json()

    response = await client.patch(
        f"/api/v1/sales/{sale_data['id']}",
        json={"items": [{"id": 2_147_483_647, "quantity": 1, "price": 250}]},
    )

    assert response.status_code == 422
    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_item.id)
    assert stored_inventory is not None
    assert stored_inventory.quantity == 8


@pytest.mark.asyncio
async def test_insufficient_stock_update_rolls_back_all_items(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 2},
                {"inventory_id": second_inventory_item.id, "quantity": 2},
            ],
        },
    )
    sale_data = create_response.json()

    response = await client.patch(
        f"/api/v1/sales/{sale_data['id']}",
        json={
            "items": [
                {
                    "id": sale_data["items"][0]["id"],
                    "quantity": 11,
                    "price": 300,
                },
                {
                    "id": sale_data["items"][1]["id"],
                    "quantity": 1,
                    "price": 170,
                },
            ],
        },
    )

    assert response.status_code == 409
    async with async_session_factory() as session:
        first_inventory = await session.get(Inventory, inventory_item.id)
        second_inventory = await session.get(Inventory, second_inventory_item.id)
        stored_items = list(
            (
                await session.scalars(
                    select(SaleItem).where(SaleItem.sale_id == sale_data["id"]),
                )
            ).all(),
        )

    assert first_inventory is not None
    assert first_inventory.quantity == 8
    assert first_inventory.price == Decimal("250.00")
    assert second_inventory is not None
    assert second_inventory.quantity == 18
    assert second_inventory.price == Decimal("180.00")
    assert sorted(item.quantity for item in stored_items) == [2, 2]


@pytest.mark.asyncio
async def test_concurrent_sales_do_not_oversell_inventory(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    payload = {
        "inventory_id": inventory_item.id,
        "quantity": 6,
        "customer_name": "Customer",
    }

    first_response, second_response = await asyncio.gather(
        client.post("/api/v1/sales/add-sales", json=payload),
        client.post("/api/v1/sales/add-sales", json=payload),
    )

    assert sorted([first_response.status_code, second_response.status_code]) == [
        201,
        409,
    ]
    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_item.id)
        sale_items = list(
            (
                await session.scalars(
                    select(SaleItem).where(
                        SaleItem.inventory_id == inventory_item.id,
                    ),
                )
            ).all(),
        )

    assert stored_inventory is not None
    assert stored_inventory.quantity == 4
    assert len(sale_items) == 1


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"items": []},
        {"items": [{"id": 1, "quantity": 0, "price": 250}]},
        {"items": [{"id": 1, "quantity": 1.5, "price": 250}]},
        {"items": [{"id": 1, "quantity": 1, "price": -1}]},
        {"items": [{"id": 1, "quantity": 1, "price": 10.123}]},
    ],
)
async def test_update_sale_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.patch("/api/v1/sales/1", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_sale_restores_inventory_and_removes_transaction(
    client: AsyncClient,
    inventory_item: Inventory,
    second_inventory_item: Inventory,
) -> None:
    create_response = await client.post(
        "/api/v1/sales/add-sales-batch",
        json={
            "customer_name": "Customer",
            "items": [
                {"inventory_id": inventory_item.id, "quantity": 10},
                {"inventory_id": second_inventory_item.id, "quantity": 3},
            ],
        },
    )
    sale_id = create_response.json()["id"]

    response = await client.delete(f"/api/v1/sales/{sale_id}")

    assert response.status_code == 204
    assert response.content == b""

    async with async_session_factory() as session:
        stored_sale = await session.get(Sale, sale_id)
        stored_sale_items = list(
            (
                await session.scalars(
                    select(SaleItem).where(SaleItem.sale_id == sale_id),
                )
            ).all(),
        )
        first_inventory = await session.get(Inventory, inventory_item.id)
        second_inventory = await session.get(Inventory, second_inventory_item.id)

    assert stored_sale is None
    assert stored_sale_items == []
    assert first_inventory is not None
    assert first_inventory.quantity == 10
    assert first_inventory.status == InventoryStatus.IN_STOCK
    assert second_inventory is not None
    assert second_inventory.quantity == 20
    assert second_inventory.status == InventoryStatus.LOW_STOCK


@pytest.mark.asyncio
async def test_delete_missing_sale_leaves_inventory_unchanged(
    client: AsyncClient,
    inventory_item: Inventory,
) -> None:
    response = await client.delete("/api/v1/sales/2147483647")

    assert response.status_code == 404
    assert response.json()["detail"] == "Sale not found"

    async with async_session_factory() as session:
        stored_inventory = await session.get(Inventory, inventory_item.id)

    assert stored_inventory is not None
    assert stored_inventory.quantity == 10
