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
        await session.execute(delete(Customer).where(Customer.name.like(f"{TEST_CUSTOMER_PREFIX}%")))
        await session.execute(
            delete(ActivityLog).where(
                ActivityLog.affected_record.like(f"Customer — {TEST_CUSTOMER_PREFIX}%"),
            ),
        )
        await session.commit()


def customer_payload(number: str, name: str = "Maria Santos") -> dict[str, str]:
    return {
        "name": f"{TEST_CUSTOMER_PREFIX} {name}",
        "number": number,
        "address": "New Cabalan, Olongapo City",
        "landmark": "Beside the barangay hall and across the covered court",
    }


@pytest.mark.asyncio
async def test_create_customer_details_saves_formatted_customer(client: AsyncClient) -> None:
    payload = customer_payload("09289876543", "mARIA sANTOS")
    payload["name"] = f"  {payload['name']}  "
    payload["address"] = f"  {payload['address']}  "
    payload["landmark"] = f"  {payload['landmark']}  "

    response = await client.post("/api/v1/customer-details/add-customer-details", json=payload)

    assert response.status_code == 201
    customer_data = response.json()
    assert customer_data == {
        "id": customer_data["id"],
        "name": f"{TEST_CUSTOMER_PREFIX} Maria Santos",
        "number": "09289876543",
        "address": "New Cabalan, Olongapo City",
        "landmark": "Beside the barangay hall and across the covered court",
    }
    async with async_session_factory() as session:
        stored_customer = await session.get(Customer, customer_data["id"])
    assert stored_customer is not None
    assert stored_customer.name == f"{TEST_CUSTOMER_PREFIX} Maria Santos"
    assert stored_customer.number == "09289876543"


@pytest.mark.asyncio
async def test_get_all_customer_details_returns_saved_customers(client: AsyncClient) -> None:
    first_response = await client.post(
        "/api/v1/customer-details/add-customer-details", json=customer_payload("09171111111", "First")
    )
    second_response = await client.post(
        "/api/v1/customer-details/add-customer-details", json=customer_payload("09172222222", "Second")
    )
    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = await client.get("/api/v1/customer-details/get-all-customer-details")

    assert response.status_code == 200
    customers = response.json()
    first_id = first_response.json()["id"]
    second_id = second_response.json()["id"]
    returned_ids = [customer["id"] for customer in customers]
    assert returned_ids.index(first_id) < returned_ids.index(second_id)
    second_customer = next(customer for customer in customers if customer["id"] == second_id)
    assert second_customer["number"] == "09172222222"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "number",
    ["0917123456", "091712345678", "0917 123456", "0917ABC4567", "0917-123-456"],
)
async def test_create_customer_details_rejects_invalid_number(client: AsyncClient, number: str) -> None:
    response = await client.post(
        "/api/v1/customer-details/add-customer-details", json=customer_payload(number)
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {"number": "09171234567", "address": "Address", "landmark": "Landmark"},
        customer_payload("09171234567") | {"name": "   "},
        customer_payload("09171234567") | {"address": "   "},
        customer_payload("09171234567") | {"landmark": "   "},
        customer_payload("09171234567") | {"name": "x" * 256},
        customer_payload("09171234567") | {"address": "x" * 501},
        customer_payload("09171234567") | {"landmark": "x" * 501},
        customer_payload("09171234567") | {"unexpected": "field"},
    ],
)
async def test_create_customer_details_rejects_invalid_data(
    client: AsyncClient, payload: dict[str, object]
) -> None:
    response = await client.post("/api/v1/customer-details/add-customer-details", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_customer_number_must_be_unique(client: AsyncClient) -> None:
    payload = customer_payload("09173333333")
    first_response = await client.post("/api/v1/customer-details/add-customer-details", json=payload)
    assert first_response.status_code == 201

    response = await client.post(
        "/api/v1/customer-details/add-customer-details",
        json=payload | {"name": f"{TEST_CUSTOMER_PREFIX} Duplicate"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "A customer with this number already exists"}


@pytest.mark.asyncio
async def test_update_customer_details_persists_changes(client: AsyncClient) -> None:
    created = await client.post(
        "/api/v1/customer-details/add-customer-details", json=customer_payload("09174444444")
    )
    customer_id = created.json()["id"]
    updated_payload = customer_payload("09175555555", "jUAN dELA cRUZ")
    updated_payload["address"] = "Updated address"
    updated_payload["landmark"] = "Long updated landmark description"

    response = await client.patch(f"/api/v1/customer-details/{customer_id}", json=updated_payload)

    assert response.status_code == 200
    assert response.json() == {
        "id": customer_id,
        **updated_payload,
        "name": f"{TEST_CUSTOMER_PREFIX} Juan Dela Cruz",
    }


@pytest.mark.asyncio
async def test_delete_customer_details_removes_record(client: AsyncClient) -> None:
    created = await client.post(
        "/api/v1/customer-details/add-customer-details", json=customer_payload("09176666666")
    )
    customer_id = created.json()["id"]

    response = await client.delete(f"/api/v1/customer-details/{customer_id}")

    assert response.status_code == 204
    async with async_session_factory() as session:
        assert await session.get(Customer, customer_id) is None


@pytest.mark.asyncio
async def test_update_and_delete_unknown_customer_return_not_found(client: AsyncClient) -> None:
    update_response = await client.patch(
        "/api/v1/customer-details/999999999", json=customer_payload("09177777777")
    )
    delete_response = await client.delete("/api/v1/customer-details/999999999")
    assert update_response.status_code == 404
    assert delete_response.status_code == 404


@pytest.mark.asyncio
async def test_customer_detail_routes_require_authentication(
    unauthenticated_client: AsyncClient,
) -> None:
    payload = customer_payload("09178888888")
    create_response = await unauthenticated_client.post(
        "/api/v1/customer-details/add-customer-details", json=payload
    )
    list_response = await unauthenticated_client.get(
        "/api/v1/customer-details/get-all-customer-details"
    )
    update_response = await unauthenticated_client.patch(
        "/api/v1/customer-details/1", json=payload
    )
    delete_response = await unauthenticated_client.delete("/api/v1/customer-details/1")

    assert create_response.status_code == 401
    assert list_response.status_code == 401
    assert update_response.status_code == 401
    assert delete_response.status_code == 401
