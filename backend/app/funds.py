from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BusinessFunds, FundTransaction


async def get_locked_business_funds(session: AsyncSession) -> BusinessFunds:
    funds = await session.scalar(
        select(BusinessFunds).where(BusinessFunds.id == 1).with_for_update(),
    )
    if funds is None:
        funds = BusinessFunds(id=1)
        session.add(funds)
        await session.flush()
    return funds


async def record_fund_transaction(
    session: AsyncSession,
    *,
    transaction_type: str,
    source: str,
    amount: Decimal,
    description: str,
    related_sale_id: int | None = None,
    related_inventory_id: int | None = None,
) -> FundTransaction | None:
    funds = await get_locked_business_funds(session)
    if not funds.is_initialized:
        return None

    if transaction_type == "income":
        funds.current_total += amount
    elif transaction_type == "expense":
        funds.current_total -= amount

    transaction = FundTransaction(
        transaction_type=transaction_type,
        source=source,
        amount=amount,
        description=description,
        related_sale_id=related_sale_id,
        related_inventory_id=related_inventory_id,
    )
    session.add(transaction)
    return transaction
