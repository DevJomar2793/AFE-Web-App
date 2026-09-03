from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Inventory, InventoryStatus, Sale
from app.schemas import SaleCreate


class InventoryItemNotFoundError(Exception):
    """Raised when a sale references an inventory item that does not exist."""


class InsufficientStockError(Exception):
    def __init__(self, available_quantity: int) -> None:
        self.available_quantity = available_quantity
        super().__init__("Insufficient inventory quantity")


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
