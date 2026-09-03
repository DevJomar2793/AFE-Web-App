import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_database_session
from app.models import Sale
from app.schemas import SaleCreate, SaleResponse
from app.services import sales as sales_service


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
        return await sales_service.list_sales(session)
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
        return await sales_service.create_sale(session, sale_data)
    except sales_service.InventoryItemNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        ) from error
    except sales_service.InsufficientStockError as error:
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
