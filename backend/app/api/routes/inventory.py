import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_database_session
from app.models import Inventory
from app.schemas.inventory import InventoryCreate, InventoryResponse
from app.services import inventory as inventory_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/inventory", tags=["inventory"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "/get-item",
    response_model=list[InventoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all inventory items",
)
async def get_inventory_items(session: DatabaseSession) -> list[Inventory]:
    try:
        return await inventory_service.list_inventory_items(session)
    except SQLAlchemyError as error:
        logger.exception("Failed to get inventory items")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get inventory items",
        ) from error


@router.post(
    "/add-stock",
    response_model=InventoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an inventory item",
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid inventory item data",
        },
    },
)
async def create_inventory_item(
    item: InventoryCreate,
    session: DatabaseSession,
) -> Inventory:
    try:
        return await inventory_service.create_inventory_item(session, item)
    except SQLAlchemyError as error:
        logger.exception("Failed to create inventory item")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create inventory item",
        ) from error
