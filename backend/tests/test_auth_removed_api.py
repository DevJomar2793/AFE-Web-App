import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/auth/login",
        "/api/v1/auth/me",
        "/api/v1/auth/register",
    ],
)
async def test_removed_auth_routes_are_not_available(
    client: AsyncClient,
    path: str,
) -> None:
    response = await client.get(path)

    assert response.status_code == 404
