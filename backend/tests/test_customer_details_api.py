from collections.abc import AsyncIterator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete

from app.database import async_session_factory
from app.models import ActivityLog, Customer


TEST_CUSTOMER_PREFIX = "__customer_api_test__"


@pytest.fixture(autouse=True)
async def clean_up_test_customers() -> AsyncIterator[None]:
    yield

    async with async_session_factory() as session:
        await session.execute(
            delete(Customer).where(Customer.name.like(f"{TEST_CUSTOMER_PREFIX}%")),
        )
        await session.execute(
            delete(ActivityLog).where(
                ActivityLog.affected_record.like(
                    f"Customer — {TEST_CUSTOMER_PREFIX}%",
                ),
            ),
        )
        await session.commit()


@pytest.mark.asyncio
async def test_create_customer_details_saves_customer(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/customer-details/add-customer-details",
        json={
            "name": f"  {TEST_CUSTOMER_PREFIX} Maria Santos  ",
            "number": "  0928 987 6543  ",
            "address": "  New Cabalan, Olongapo City  ",
            "landmark": "  Beside 7-Eleven  ",
        },
    )

    assert response.status_code == 201
    customer_data = response.json()
    assert customer_data == {
        "id": customer_data["id"],
        "name": f"{TEST_CUSTOMER_PREFIX} Maria Santos",
        "number": "0928 987 6543",
        "address": "New Cabalan, Olongapo City",
        "landmark": "Beside 7-Eleven",
    }
    assert isinstance(customer_data["id"], int)

    async with async_session_factory() as session:
        stored_customer = await session.get(Customer, customer_data["id"])

    assert stored_customer is not None
    assert stored_customer.name == f"{TEST_CUSTOMER_PREFIX} Maria Santos"
    assert stored_customer.number == "0928 987 6543"
    assert stored_customer.address == "New Cabalan, Olongapo City"
    assert stored_customer.landmark == "Beside 7-Eleven"


@pytest.mark.asyncio
async def test_get_all_customer_details_returns_saved_customers(
    client: AsyncClient,
) -> None:
    first_response = await client.post(
        "/api/v1/customer-details/add-customer-details",
        json={
            "name": f"{TEST_CUSTOMER_PREFIX} First",
            "number": "0917 111 1111",
            "address": "First address",
            "landmark": "First landmark",
        },
    )
    second_response = await client.post(
        "/api/v1/customer-details/add-customer-details",
        json={
            "name": f"{TEST_CUSTOMER_PREFIX} Second",
            "number": "0917 222 2222",
            "address": "Second address",
            "landmark": "Second landmark",
        },
    )
    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = await client.get(
        "/api/v1/customer-details/get-all-customer-details",
    )

    assert response.status_code == 200
    customers = response.json()
    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]
    returned_ids = [customer["id"] for customer in customers]
    assert returned_ids.index(first_id) < returned_ids.index(second_id)
    assert next(customer for customer in customers if customer["id"] == second_id) == {
        "id": second_id,
        "name": f"{TEST_CUSTOMER_PREFIX} Second",
        "number": "0917 222 2222",
        "address": "Second address",
        "landmark": "Second landmark",
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "Landmark",
        },
        {
            "name": "   ",
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "   ",
            "address": "Address",
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "   ",
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "   ",
        },
        {
            "name": "x" * 256,
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "x" * 51,
            "address": "Address",
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "x" * 501,
            "landmark": "Landmark",
        },
        {
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "x" * 256,
        },
        {
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "Landmark",
            "unexpected": "field",
        },
    ],
)
async def test_create_customer_details_rejects_invalid_data(
    client: AsyncClient,
    payload: dict[str, object],
) -> None:
    response = await client.post(
        "/api/v1/customer-details/add-customer-details",
        json=payload,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_customer_detail_routes_require_authentication(
    unauthenticated_client: AsyncClient,
) -> None:
    create_response = await unauthenticated_client.post(
        "/api/v1/customer-details/add-customer-details",
        json={
            "name": "Customer",
            "number": "0917 123 4567",
            "address": "Address",
            "landmark": "Landmark",
        },
    )
    list_response = await unauthenticated_client.get(
        "/api/v1/customer-details/get-all-customer-details",
    )

    assert create_response.status_code == 401
    assert list_response.status_code == 401
