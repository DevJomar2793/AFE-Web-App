import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_database_session
from app.models import Inventory
from app.schemas.inventory import InventoryCreate, InventoryResponse


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/inventory", tags=["inventory"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


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
    inventory = Inventory(
        item=item.item,
        quantity=item.quantity,
        price=item.price,
        status=item.status,
    )
    session.add(inventory)

    try:
        await session.commit()
        await session.refresh(inventory)
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create inventory item", exc_info=error)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create inventory item",
        ) from error

    return inventory
