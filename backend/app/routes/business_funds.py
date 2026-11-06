import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.funds import get_locked_business_funds, record_fund_transaction
from app.models import ActivityLog, BusinessFunds, FundTransaction, User
from app.schemas import (
    BusinessFundsInitialize,
    BusinessFundsResponse,
    FundTransactionCreate,
    FundTransactionResponse,
)
from app.security import get_current_admin


logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/business-funds",
    tags=["business funds"],
    dependencies=[Depends(get_current_admin)],
)
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


@router.get("", response_model=BusinessFundsResponse)
async def get_business_funds(session: DatabaseSession) -> BusinessFunds:
    try:
        funds = await session.get(BusinessFunds, 1)
        if funds is None:
            funds = BusinessFunds(id=1)
            session.add(funds)
            await session.commit()
            await session.refresh(funds)
        return funds
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to get business funds")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load business funds",
        ) from error


@router.get(
    "/transactions",
    response_model=list[FundTransactionResponse],
)
async def get_fund_transactions(
    session: DatabaseSession,
) -> list[FundTransaction]:
    try:
        result = await session.scalars(
            select(FundTransaction).order_by(
                FundTransaction.created_at.desc(),
                FundTransaction.id.desc(),
            ),
        )
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get fund transactions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load fund transactions",
        ) from error


@router.post(
    "/initialize",
    response_model=BusinessFundsResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initialize_business_funds(
    input_data: BusinessFundsInitialize,
    session: DatabaseSession,
    current_admin: CurrentAdmin,
) -> BusinessFunds:
    try:
        funds = await get_locked_business_funds(session)
        if funds.is_initialized:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Business funds have already been initialized",
            )

        funds.current_total = input_data.amount
        funds.is_initialized = True
        session.add(
            FundTransaction(
                transaction_type="opening_balance",
                source="opening_balance",
                amount=input_data.amount,
                description="Opening business funds balance",
            ),
        )
        session.add(
            ActivityLog(
                action="added",
                affected_record="Business funds — opening balance",
                admin_email=current_admin.email,
            ),
        )
        await session.commit()
        await session.refresh(funds)
        return funds
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to initialize business funds")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to initialize business funds",
        ) from error


@router.post(
    "/transactions",
    response_model=FundTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_fund_transaction(
    input_data: FundTransactionCreate,
    session: DatabaseSession,
    current_admin: CurrentAdmin,
) -> FundTransaction:
    try:
        funds = await get_locked_business_funds(session)
        if not funds.is_initialized:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Set the current business funds before adding transactions",
            )

        transaction = await record_fund_transaction(
            session,
            transaction_type=input_data.transaction_type,
            source="manual",
            amount=input_data.amount,
            description=input_data.description,
        )
        if transaction is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Set the current business funds before adding transactions",
            )
        session.add(
            ActivityLog(
                action="added",
                affected_record=(
                    f"Business funds — {input_data.transaction_type}: "
                    f"{input_data.description}"
                ),
                admin_email=current_admin.email,
            ),
        )
        await session.commit()
        await session.refresh(transaction)
        return transaction
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create fund transaction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save fund transaction",
        ) from error
