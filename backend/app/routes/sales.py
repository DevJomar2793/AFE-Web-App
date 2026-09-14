import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_database_session
from app.models import Inventory, InventoryStatus, Sale, SaleItem
from app.schemas import (
    SaleBatchCreate,
    SaleBatchItemCreate,
    SaleCreate,
    SaleResponse,
    SaleUpdate,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sales", tags=["sales"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "/get-sales",
    response_model=list[SaleResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all sale transactions",
)
async def get_sales(session: DatabaseSession) -> list[Sale]:
    try:
        statement = (
            select(Sale)
            .options(
                selectinload(Sale.items).selectinload(SaleItem.item),
            )
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
    summary="Create a single-item sale transaction",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Inventory item not found"},
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
    requested_items = [
        SaleBatchItemCreate(
            inventory_id=sale_data.inventory_id,
            quantity=sale_data.quantity,
        ),
    ]
    return await create_sale_transaction(
        sale_data.customer_name,
        requested_items,
        session,
    )


@router.post(
    "/add-sales-batch",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a multi-item sale transaction",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "One or more inventory items were not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "Insufficient inventory quantity",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid sale data",
        },
    },
)
async def create_sale_batch(
    sale_data: SaleBatchCreate,
    session: DatabaseSession,
) -> Sale:
    return await create_sale_transaction(
        sale_data.customer_name,
        sale_data.items,
        session,
    )


async def create_sale_transaction(
    customer_name: str,
    requested_items: list[SaleBatchItemCreate],
    session: AsyncSession,
) -> Sale:
    try:
        requested_inventory_ids = [item.inventory_id for item in requested_items]
        statement = (
            select(Inventory)
            .where(Inventory.id.in_(requested_inventory_ids))
            .order_by(Inventory.id)
            .with_for_update()
        )
        result = await session.scalars(statement)
        inventory_by_id = {item.id: item for item in result.all()}

        if len(inventory_by_id) != len(requested_inventory_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more inventory items were not found",
            )

        for requested_item in requested_items:
            inventory_item = inventory_by_id[requested_item.inventory_id]
            if requested_item.quantity > inventory_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient inventory quantity for {inventory_item.item}. "
                        f"Only {inventory_item.quantity} available."
                    ),
                )

        sale = Sale(customer_name=customer_name, items=[])

        for requested_item in requested_items:
            inventory_item = inventory_by_id[requested_item.inventory_id]
            sale_price = inventory_item.price
            if (
                requested_item.quantity >= 6
                and inventory_item.wholesale_price is not None
            ):
                sale_price = inventory_item.wholesale_price

            inventory_item.quantity -= requested_item.quantity
            update_inventory_status(inventory_item)
            sale.items.append(
                SaleItem(
                    inventory_id=inventory_item.id,
                    quantity=requested_item.quantity,
                    price=sale_price,
                    item=inventory_item,
                ),
            )

        session.add(sale)
        await session.commit()
        return await load_sale(sale.id, session)
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
    summary="Update all items in a sale transaction",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Sale, sale item, or inventory item not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "Insufficient inventory quantity",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid sale data or changed item list",
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

        sale_items_result = await session.scalars(
            select(SaleItem)
            .where(SaleItem.sale_id == sale_id)
            .order_by(SaleItem.id)
            .with_for_update(),
        )
        sale_items = list(sale_items_result.all())
        existing_item_ids = {item.id for item in sale_items}
        requested_item_ids = {item.id for item in sale_data.items}
        if existing_item_ids != requested_item_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Sale items cannot be added, removed, or replaced.",
            )

        requested_by_id = {item.id: item for item in sale_data.items}
        inventory_ids = sorted({item.inventory_id for item in sale_items})
        inventory_result = await session.scalars(
            select(Inventory)
            .where(Inventory.id.in_(inventory_ids))
            .order_by(Inventory.id)
            .with_for_update(),
        )
        inventory_by_id = {item.id: item for item in inventory_result.all()}
        if len(inventory_by_id) != len(inventory_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more inventory items were not found",
            )

        quantity_deltas: dict[int, int] = {}
        for sale_item in sale_items:
            requested_item = requested_by_id[sale_item.id]
            quantity_deltas[sale_item.inventory_id] = (
                quantity_deltas.get(sale_item.inventory_id, 0)
                + requested_item.quantity
                - sale_item.quantity
            )

        for inventory_id, quantity_delta in quantity_deltas.items():
            inventory_item = inventory_by_id[inventory_id]
            if quantity_delta > inventory_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient inventory quantity for {inventory_item.item}. "
                        f"Only {inventory_item.quantity} additional units available."
                    ),
                )

        for sale_item in sale_items:
            requested_item = requested_by_id[sale_item.id]
            inventory_item = inventory_by_id[sale_item.inventory_id]
            inventory_item.quantity -= requested_item.quantity - sale_item.quantity
            inventory_item.price = requested_item.price
            update_inventory_status(inventory_item)
            sale_item.quantity = requested_item.quantity
            sale_item.price = requested_item.price

        sale.updated_at = datetime.now(timezone.utc)
        await session.commit()
        return await load_sale(sale.id, session)
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


async def load_sale(sale_id: int, session: AsyncSession) -> Sale:
    sale = await session.scalar(
        select(Sale)
        .where(Sale.id == sale_id)
        .options(
            selectinload(Sale.items).selectinload(SaleItem.item),
        ),
    )
    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found",
        )
    return sale


def update_inventory_status(inventory_item: Inventory) -> None:
    if inventory_item.quantity == 0:
        inventory_item.status = InventoryStatus.OUT_OF_STOCK
    elif inventory_item.status == InventoryStatus.OUT_OF_STOCK:
        inventory_item.status = InventoryStatus.IN_STOCK
