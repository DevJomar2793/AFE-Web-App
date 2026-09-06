from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inventory
from app.schemas import InventoryCreate


async def list_inventory_items(session: AsyncSession) -> list[Inventory]:
    result = await session.scalars(select(Inventory).order_by(Inventory.id))
    return list(result.all())


async def create_inventory_item(
    session: AsyncSession,
    item: InventoryCreate,
) -> Inventory:
    inventory = Inventory(
        item=item.item,
        quantity=item.quantity,
        returns_count=0,
        price=item.price,
        status=item.status,
    )
    session.add(inventory)

    try:
        await session.commit()
        await session.refresh(inventory)
    except SQLAlchemyError:
        await session.rollback()
        raise

    return inventory
