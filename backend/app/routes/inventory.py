import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.funds import record_fund_transaction
from app.models import (
    ActivityLog,
    Inventory,
    InventoryStatus,
    Return,
    SaleItem,
    User,
)
from app.schemas import InventoryCreate, InventoryResponse, InventoryUpdate
from app.security import get_current_admin, get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


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
    current_user: CurrentUser,
) -> Inventory:
    inventory = Inventory(
        item=item_data.item,
        quantity=item_data.quantity,
        returns_count=0,
        price=item_data.price,
        wholesale_price=item_data.wholesale_price,
        purchase_cost=item_data.purchase_cost,
        category=item_data.category,
        oil_size=item_data.oil_size,
        status=item_data.status,
    )
    session.add(inventory)

    try:
        await session.flush()
        purchase_total = inventory.purchase_cost * inventory.quantity
        if purchase_total > 0:
            await record_fund_transaction(
                session,
                transaction_type="expense",
                source="inventory_purchase",
                amount=purchase_total,
                description=f"Initial stock purchase — {inventory.item}",
                related_inventory_id=inventory.id,
            )
        session.add(
            ActivityLog(
                action="added",
                affected_record=f"Inventory — {inventory.item}",
                admin_email=current_user.email,
            ),
        )
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
    current_user: CurrentUser,
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

        previous_purchase_total = inventory.purchase_cost * inventory.quantity
        inventory.quantity = item_data.quantity
        inventory.price = item_data.price
        if "wholesale_price" in item_data.model_fields_set:
            inventory.wholesale_price = item_data.wholesale_price
        if item_data.purchase_cost is not None:
            inventory.purchase_cost = item_data.purchase_cost
        next_category = item_data.category or inventory.category
        next_oil_size = inventory.oil_size
        if "oil_size" in item_data.model_fields_set:
            next_oil_size = item_data.oil_size
        if next_category == "eggs":
            next_oil_size = None
        elif next_oil_size is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Oil products must include a product size",
            )
        inventory.category = next_category
        inventory.oil_size = next_oil_size
        if item_data.quantity == 0:
            inventory.status = InventoryStatus.OUT_OF_STOCK
        elif inventory.status == InventoryStatus.OUT_OF_STOCK:
            inventory.status = InventoryStatus.IN_STOCK

        updated_purchase_total = inventory.purchase_cost * inventory.quantity
        purchase_total_difference = (
            updated_purchase_total - previous_purchase_total
        )
        if purchase_total_difference != 0:
            is_purchase_increase = purchase_total_difference > 0
            await record_fund_transaction(
                session,
                transaction_type="expense" if is_purchase_increase else "income",
                source="inventory_purchase",
                amount=abs(purchase_total_difference),
                description=(
                    f"Stock purchase adjustment — {inventory.item} "
                    f"({'increase' if is_purchase_increase else 'decrease'} "
                    "in stock value)"
                ),
                related_inventory_id=inventory.id,
            )

        session.add(
            ActivityLog(
                action="edited",
                affected_record=f"Inventory — {inventory.item}",
                admin_email=current_user.email,
            ),
        )
        await session.commit()
        await session.refresh(inventory)
        return inventory
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to update inventory item")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update inventory item",
        ) from error


@router.delete(
    "/{inventory_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an unused inventory item",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "Administrator access is required",
        },
        status.HTTP_404_NOT_FOUND: {
            "description": "Inventory item not found",
        },
        status.HTTP_409_CONFLICT: {
            "description": "Inventory item has sale or return history",
        },
    },
)
async def delete_inventory_item(
    inventory_id: int,
    session: DatabaseSession,
    current_admin: CurrentAdmin,
) -> Response:
    try:
        inventory = await session.scalar(
            select(Inventory)
            .where(Inventory.id == inventory_id)
            .with_for_update(),
        )
        if inventory is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )

        sale_item_id = await session.scalar(
            select(SaleItem.id)
            .where(SaleItem.inventory_id == inventory_id)
            .limit(1),
        )
        return_id = await session.scalar(
            select(Return.id)
            .where(Return.inventory_id == inventory_id)
            .limit(1),
        )
        if sale_item_id is not None or return_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This inventory item cannot be deleted because it has "
                    "sale or return history."
                ),
            )

        item_name = inventory.item
        await session.delete(inventory)
        session.add(
            ActivityLog(
                action="deleted",
                affected_record=f"Inventory — {item_name}",
                admin_email=current_admin.email,
            ),
        )
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to delete inventory item")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete inventory item",
        ) from error
