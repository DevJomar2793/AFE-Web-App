import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_database_session
from app.models import Return, Sale
from app.schemas import (
    ReturnCreate,
    ReturnResponse,
    SaleCreate,
    SaleResponse,
    SaleUpdate,
)
from app.services import transaction as transaction_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sales", tags=["sales"])
returns_router = APIRouter(prefix="/returns", tags=["returns"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "/get-sales",
    response_model=list[SaleResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all sales",
)
async def get_sales(session: DatabaseSession) -> list[Sale]:
    try:
        return await transaction_service.list_sales(session)
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
        return await transaction_service.create_sale(session, sale_data)
    except transaction_service.InventoryItemNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        ) from error
    except transaction_service.InsufficientStockError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Insufficient inventory quantity. "
                f"Only {error.available_quantity} available."
            ),
        ) from error
    except SQLAlchemyError as error:
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
        return await transaction_service.update_sale(
            session,
            sale_id,
            sale_data,
        )
    except transaction_service.SaleNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found",
        ) from error
    except transaction_service.InventoryItemNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        ) from error
    except transaction_service.InsufficientStockError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Insufficient inventory quantity. "
                f"Only {error.available_quantity} additional units available."
            ),
        ) from error
    except SQLAlchemyError as error:
        logger.exception("Failed to update sale")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update sale",
        ) from error


@returns_router.get(
    "/get-returns",
    response_model=list[ReturnResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all returns",
)
async def get_returns(session: DatabaseSession) -> list[Return]:
    try:
        return await transaction_service.list_returns(session)
    except SQLAlchemyError as error:
        logger.exception("Failed to get returns")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get returns",
        ) from error


@returns_router.post(
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
        return await transaction_service.create_return(session, return_data)
    except transaction_service.InventoryItemNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        ) from error
    except SQLAlchemyError as error:
        logger.exception("Failed to create return")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create return",
        ) from error
