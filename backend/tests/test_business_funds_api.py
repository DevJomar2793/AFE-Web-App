from collections.abc import AsyncIterator
from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, func, select

from app.database import async_session_factory
from app.models import BusinessFunds, FundTransaction, Inventory, User
from app.security import create_access_token, hash_password


@pytest.fixture
async def isolated_business_funds() -> AsyncIterator[None]:
    async with async_session_factory() as session:
        funds = await session.get(BusinessFunds, 1)
        if funds is None:
            funds = BusinessFunds(id=1)
            session.add(funds)
            await session.flush()
        previous_total = funds.current_total
        previous_initialized = funds.is_initialized
        previous_transaction_id = await session.scalar(
            select(func.max(FundTransaction.id)),
        )
        funds.current_total = Decimal("0.00")
        funds.is_initialized = False
        await session.commit()

    yield

    async with async_session_factory() as session:
        funds = await session.get(BusinessFunds, 1)
        assert funds is not None
        funds.current_total = previous_total
        funds.is_initialized = previous_initialized
        if previous_transaction_id is None:
            await session.execute(delete(FundTransaction))
        else:
            await session.execute(
                delete(FundTransaction).where(
                    FundTransaction.id > previous_transaction_id,
                ),
            )
        await session.commit()


@pytest.mark.asyncio
async def test_admin_initializes_and_records_manual_transactions(
    client: AsyncClient,
    isolated_business_funds: None,
) -> None:
    initialize_response = await client.post(
        "/api/v1/business-funds/initialize",
        json={"amount": "1000.00"},
    )
    income_response = await client.post(
        "/api/v1/business-funds/transactions",
        json={
            "transaction_type": "income",
            "amount": "250.00",
            "description": "  Customer payment  ",
        },
    )
    expense_response = await client.post(
        "/api/v1/business-funds/transactions",
        json={
            "transaction_type": "expense",
            "amount": "1400.00",
            "description": "Supplier purchase",
        },
    )
    funds_response = await client.get("/api/v1/business-funds")
    history_response = await client.get(
        "/api/v1/business-funds/transactions",
    )

    assert initialize_response.status_code == 201
    assert initialize_response.json()["current_total"] == "1000.00"
    assert income_response.status_code == 201
    assert income_response.json()["description"] == "Customer payment"
    assert expense_response.status_code == 201
    assert funds_response.json()["current_total"] == "-150.00"
    assert [item["transaction_type"] for item in history_response.json()[:3]] == [
        "expense",
        "income",
        "opening_balance",
    ]

    repeated_response = await client.post(
        "/api/v1/business-funds/initialize",
        json={"amount": "500.00"},
    )
    assert repeated_response.status_code == 409


@pytest.mark.asyncio
async def test_sales_and_stock_update_business_funds(
    client: AsyncClient,
    isolated_business_funds: None,
) -> None:
    await client.post(
        "/api/v1/business-funds/initialize",
        json={"amount": "1000.00"},
    )
    inventory_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": f"__funds_test_{uuid4()}__",
            "quantity": 10,
            "price": "50.00",
            "wholesale_price": None,
            "purchase_cost": "20.00",
        },
    )
    inventory_id = inventory_response.json()["id"]

    try:
        sale_response = await client.post(
            "/api/v1/sales/add-sales",
            json={
                "inventory_id": inventory_id,
                "quantity": 2,
                "customer_name": "Funds Test Customer",
            },
        )
        sale = sale_response.json()
        sale_id = sale["id"]
        sale_item_id = sale["items"][0]["id"]

        edit_response = await client.patch(
            f"/api/v1/sales/{sale_id}",
            json={
                "items": [
                    {"id": sale_item_id, "quantity": 2, "price": "70.00"},
                ],
            },
        )
        delete_response = await client.delete(f"/api/v1/sales/{sale_id}")
        funds_response = await client.get("/api/v1/business-funds")
        history_response = await client.get(
            "/api/v1/business-funds/transactions",
        )

        assert inventory_response.status_code == 201
        assert sale_response.status_code == 201
        assert edit_response.status_code == 200
        assert delete_response.status_code == 204
        assert funds_response.json()["current_total"] == "800.00"
        sources = [item["source"] for item in history_response.json()]
        assert "inventory_purchase" in sources
        assert "sale" in sources
        assert "sale_adjustment" in sources
        assert "sale_reversal" in sources
    finally:
        async with async_session_factory() as session:
            inventory = await session.get(Inventory, inventory_id)
            if inventory is not None:
                await session.delete(inventory)
                await session.commit()


@pytest.mark.asyncio
async def test_stock_edits_adjust_funds_by_purchase_value_difference(
    client: AsyncClient,
    isolated_business_funds: None,
) -> None:
    await client.post(
        "/api/v1/business-funds/initialize",
        json={"amount": "1000.00"},
    )
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": f"__stock_adjustment_test_{uuid4()}__",
            "quantity": 10,
            "price": "50.00",
            "wholesale_price": None,
            "purchase_cost": "20.00",
        },
    )
    inventory_id = create_response.json()["id"]

    async def update_stock(quantity: int, purchase_cost: str) -> None:
        response = await client.patch(
            f"/api/v1/inventory/{inventory_id}",
            json={
                "quantity": quantity,
                "price": "50.00",
                "wholesale_price": None,
                "purchase_cost": purchase_cost,
            },
        )
        assert response.status_code == 200

    try:
        await update_stock(quantity=12, purchase_cost="20.00")
        await update_stock(quantity=12, purchase_cost="25.00")
        await update_stock(quantity=10, purchase_cost="25.00")

        history_before_repeat = await client.get(
            "/api/v1/business-funds/transactions",
        )
        await update_stock(quantity=10, purchase_cost="25.00")
        history_after_repeat = await client.get(
            "/api/v1/business-funds/transactions",
        )
        funds_response = await client.get("/api/v1/business-funds")

        assert funds_response.json()["current_total"] == "750.00"
        assert len(history_after_repeat.json()) == len(
            history_before_repeat.json(),
        )
        stock_transactions = [
            transaction
            for transaction in history_after_repeat.json()
            if transaction["related_inventory_id"] == inventory_id
        ]
        assert [
            transaction["transaction_type"] for transaction in stock_transactions
        ] == ["income", "expense", "expense", "expense"]
        assert [transaction["amount"] for transaction in stock_transactions] == [
            "50.00",
            "60.00",
            "40.00",
            "200.00",
        ]
    finally:
        async with async_session_factory() as session:
            inventory = await session.get(Inventory, inventory_id)
            if inventory is not None:
                await session.delete(inventory)
                await session.commit()


@pytest.mark.asyncio
async def test_reducing_stock_value_can_restore_a_positive_fund_balance(
    client: AsyncClient,
    isolated_business_funds: None,
) -> None:
    await client.post(
        "/api/v1/business-funds/initialize",
        json={"amount": "50.00"},
    )
    create_response = await client.post(
        "/api/v1/inventory/add-stock",
        json={
            "item": f"__negative_balance_test_{uuid4()}__",
            "quantity": 10,
            "price": "50.00",
            "wholesale_price": None,
            "purchase_cost": "20.00",
        },
    )
    inventory_id = create_response.json()["id"]

    try:
        negative_funds_response = await client.get("/api/v1/business-funds")
        edit_response = await client.patch(
            f"/api/v1/inventory/{inventory_id}",
            json={
                "quantity": 2,
                "price": "50.00",
                "wholesale_price": None,
                "purchase_cost": "10.00",
            },
        )
        positive_funds_response = await client.get("/api/v1/business-funds")
        history_response = await client.get(
            "/api/v1/business-funds/transactions",
        )

        assert negative_funds_response.json()["current_total"] == "-150.00"
        assert edit_response.status_code == 200
        assert positive_funds_response.json()["current_total"] == "30.00"
        assert history_response.json()[0]["transaction_type"] == "income"
        assert history_response.json()[0]["amount"] == "180.00"
        assert history_response.json()[0]["source"] == "inventory_purchase"
    finally:
        async with async_session_factory() as session:
            inventory = await session.get(Inventory, inventory_id)
            if inventory is not None:
                await session.delete(inventory)
                await session.commit()


@pytest.mark.asyncio
async def test_regular_user_cannot_access_business_funds(
    unauthenticated_client: AsyncClient,
    isolated_business_funds: None,
) -> None:
    unauthenticated_response = await unauthenticated_client.get(
        "/api/v1/business-funds",
    )
    assert unauthenticated_response.status_code == 401

    regular_user = User(
        email=f"funds-user-{uuid4()}@example.com",
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
        get_response = await unauthenticated_client.get(
            "/api/v1/business-funds",
            headers=headers,
        )
        create_response = await unauthenticated_client.post(
            "/api/v1/business-funds/transactions",
            headers=headers,
            json={
                "transaction_type": "income",
                "amount": "10.00",
                "description": "Not allowed",
            },
        )
        assert get_response.status_code == 403
        assert create_response.status_code == 403
    finally:
        async with async_session_factory() as session:
            await session.execute(delete(User).where(User.id == regular_user.id))
            await session.commit()
