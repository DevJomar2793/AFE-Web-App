from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Inventory, InventoryStatus, Return, Sale
from app.schemas import ReturnCreate, SaleCreate, SaleUpdate


class InventoryItemNotFoundError(Exception):
    """Raised when a transaction references an unknown inventory item."""


class InsufficientStockError(Exception):
    def __init__(self, available_quantity: int) -> None:
        self.available_quantity = available_quantity
        super().__init__("Insufficient inventory quantity")


class SaleNotFoundError(Exception):
    """Raised when a sale cannot be found."""


async def list_sales(session: AsyncSession) -> list[Sale]:
    statement = (
        select(Sale)
        .options(selectinload(Sale.item))
        .order_by(Sale.created_at.desc(), Sale.id.desc())
    )
    result = await session.scalars(statement)
    return list(result.all())


async def create_sale(session: AsyncSession, sale_data: SaleCreate) -> Sale:
    try:
        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == sale_data.inventory_id)
            .with_for_update(),
        )

        if inventory_item is None:
            raise InventoryItemNotFoundError

        if sale_data.quantity > inventory_item.quantity:
            raise InsufficientStockError(inventory_item.quantity)

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
    except (InventoryItemNotFoundError, InsufficientStockError):
        await session.rollback()
        raise
    except SQLAlchemyError:
        await session.rollback()
        raise


async def update_sale(
    session: AsyncSession,
    sale_id: int,
    sale_data: SaleUpdate,
) -> Sale:
    try:
        sale = await session.scalar(
            select(Sale).where(Sale.id == sale_id).with_for_update(),
        )
        if sale is None:
            raise SaleNotFoundError

        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == sale.inventory_id)
            .with_for_update(),
        )
        if inventory_item is None:
            raise InventoryItemNotFoundError

        quantity_delta = sale_data.quantity - sale.quantity
        if quantity_delta > inventory_item.quantity:
            raise InsufficientStockError(inventory_item.quantity)

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
    except (
        InventoryItemNotFoundError,
        InsufficientStockError,
        SaleNotFoundError,
    ):
        await session.rollback()
        raise
    except SQLAlchemyError:
        await session.rollback()
        raise


async def list_returns(session: AsyncSession) -> list[Return]:
    statement = (
        select(Return)
        .options(selectinload(Return.item))
        .order_by(Return.created_at.desc(), Return.id.desc())
    )
    result = await session.scalars(statement)
    return list(result.all())


async def create_return(
    session: AsyncSession,
    return_data: ReturnCreate,
) -> Return:
    try:
        inventory_item = await session.scalar(
            select(Inventory)
            .where(Inventory.id == return_data.inventory_id)
            .with_for_update(),
        )

        if inventory_item is None:
            raise InventoryItemNotFoundError

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
    except InventoryItemNotFoundError:
        await session.rollback()
        raise
    except SQLAlchemyError:
        await session.rollback()
        raise
