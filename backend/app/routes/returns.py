import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_database_session
from app.models import Inventory, Return
from app.schemas import ReturnCreate, ReturnResponse


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/returns", tags=["returns"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "/get-returns",
    response_model=list[ReturnResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all returns",
)
async def get_returns(session: DatabaseSession) -> list[Return]:
    try:
        statement = (
            select(Return)
            .options(selectinload(Return.item))
            .order_by(Return.created_at.desc(), Return.id.desc())
        )
        result = await session.scalars(statement)
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get returns")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get returns",
        ) from error


@router.post(
    "/add-returns",
    response_model=ReturnResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a return",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Inventory item not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid return data",
        },
    },
)
async def create_return(
    return_data: ReturnCreate,
    session: DatabaseSession,
) -> Return:
    try:
        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == return_data.inventory_id)
            .with_for_update(),
        )
        if inventory_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )

        inventory_item.returns_count += return_data.quantity
        inventory_return = Return(
            inventory_id=inventory_item.id,
            quantity=return_data.quantity,
            customer_name=return_data.customer_name,
            reason=return_data.reason,
            item=inventory_item,
        )
        session.add(inventory_return)
        await session.commit()
        await session.refresh(inventory_return, attribute_names=["item"])
        return inventory_return
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create return")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create return",
        ) from error
