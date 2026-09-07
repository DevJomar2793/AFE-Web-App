import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.models import Inventory, InventoryStatus
from app.schemas import InventoryCreate, InventoryResponse, InventoryUpdate


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
        result = await session.scalars(select(Inventory).order_by(Inventory.id))
        return list(result.all())
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
    item_data: InventoryCreate,
    session: DatabaseSession,
) -> Inventory:
    inventory = Inventory(
        item=item_data.item,
        quantity=item_data.quantity,
        returns_count=0,
        price=item_data.price,
        status=item_data.status,
    )
    session.add(inventory)

    try:
        await session.commit()
        await session.refresh(inventory)
        return inventory
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create inventory item")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create inventory item",
        ) from error


@router.patch(
    "/{inventory_id}",
    response_model=InventoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update an inventory item",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Inventory item not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid inventory item data",
        },
    },
)
async def update_inventory_item(
    inventory_id: int,
    item_data: InventoryUpdate,
    session: DatabaseSession,
) -> Inventory:
    try:
        inventory = await session.scalar(
            select(Inventory)
            .where(Inventory.id == inventory_id)
            .with_for_update(),
        )
        if inventory is None:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )

        inventory.quantity = item_data.quantity
        inventory.price = item_data.price
        if item_data.quantity == 0:
            inventory.status = InventoryStatus.OUT_OF_STOCK
        elif inventory.status == InventoryStatus.OUT_OF_STOCK:
            inventory.status = InventoryStatus.IN_STOCK

        await session.commit()
        await session.refresh(inventory)
        return inventory
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to update inventory item")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update inventory item",
        ) from error
