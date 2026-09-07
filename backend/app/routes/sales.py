import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_database_session
from app.models import Inventory, InventoryStatus, Sale
from app.schemas import SaleCreate, SaleResponse, SaleUpdate


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sales", tags=["sales"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "/get-sales",
    response_model=list[SaleResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all sales",
)
async def get_sales(session: DatabaseSession) -> list[Sale]:
    try:
        statement = (
            select(Sale)
            .options(selectinload(Sale.item))
            .order_by(Sale.created_at.desc(), Sale.id.desc())
        )
        result = await session.scalars(statement)
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get sales")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get sales",
        ) from error


@router.post(
    "/add-sales",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a sale",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Inventory item not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "Insufficient inventory quantity",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid sale data",
        },
    },
)
async def create_sale(
    sale_data: SaleCreate,
    session: DatabaseSession,
) -> Sale:
    try:
        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == sale_data.inventory_id)
            .with_for_update(),
        )
        if inventory_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )
        if sale_data.quantity > inventory_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Insufficient inventory quantity. "
                    f"Only {inventory_item.quantity} available."
                ),
            )

        inventory_item.quantity -= sale_data.quantity
        if inventory_item.quantity == 0:
            inventory_item.status = InventoryStatus.OUT_OF_STOCK

        sale = Sale(
            inventory_id=inventory_item.id,
            quantity=sale_data.quantity,
            price=inventory_item.price,
            customer_name=sale_data.customer_name,
            item=inventory_item,
        )
        session.add(sale)
        await session.commit()
        await session.refresh(sale, attribute_names=["item"])
        return sale
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create sale")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create sale",
        ) from error


@router.patch(
    "/{sale_id}",
    response_model=SaleResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a sale",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Sale or inventory item not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "Insufficient inventory quantity",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid sale data",
        },
    },
)
async def update_sale(
    sale_id: int,
    sale_data: SaleUpdate,
    session: DatabaseSession,
) -> Sale:
    try:
        sale = await session.scalar(
            select(Sale).where(Sale.id == sale_id).with_for_update(),
        )
        if sale is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found",
            )

        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == sale.inventory_id)
            .with_for_update(),
        )
        if inventory_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )

        quantity_delta = sale_data.quantity - sale.quantity
        if quantity_delta > inventory_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Insufficient inventory quantity. "
                    f"Only {inventory_item.quantity} additional units available."
                ),
            )

        inventory_item.quantity -= quantity_delta
        inventory_item.price = sale_data.price
        if inventory_item.quantity == 0:
            inventory_item.status = InventoryStatus.OUT_OF_STOCK
        elif inventory_item.status == InventoryStatus.OUT_OF_STOCK:
            inventory_item.status = InventoryStatus.IN_STOCK

        sale.quantity = sale_data.quantity
        sale.price = sale_data.price

        await session.commit()
        await session.refresh(sale)
        await session.refresh(sale, attribute_names=["item"])
        return sale
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to update sale")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update sale",
        ) from error
