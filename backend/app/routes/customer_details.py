import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.models import ActivityLog, Customer, User
from app.schemas import CustomerCreate, CustomerResponse
from app.security import get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/customer-details",
    tags=["customer details"],
    dependencies=[Depends(get_current_user)],
)
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def duplicate_number_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="A customer with this number already exists",
    )


@router.post(
    "/add-customer-details",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create customer details",
    responses={
        status.HTTP_409_CONFLICT: {
            "description": "Customer number already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid customer details",
        },
    },
)
async def create_customer_details(
    customer_data: CustomerCreate,
    session: DatabaseSession,
    current_user: CurrentUser,
) -> Customer:
    customer = Customer(
        name=customer_data.name,
        number=customer_data.number,
        address=customer_data.address,
        landmark=customer_data.landmark,
    )
    session.add(customer)

    try:
        await session.flush()
        session.add(
            ActivityLog(
                action="added",
                affected_record=f"Customer — {customer.name}",
                admin_email=current_user.email,
            ),
        )
        await session.commit()
        await session.refresh(customer)
        return customer
    except IntegrityError as error:
        await session.rollback()
        raise duplicate_number_error() from error
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create customer details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create customer details",
        ) from error


@router.get(
    "/get-all-customer-details",
    response_model=list[CustomerResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all customer details",
)
async def get_all_customer_details(session: DatabaseSession) -> list[Customer]:
    try:
        result = await session.scalars(select(Customer).order_by(Customer.id))
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get customer details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get customer details",
        ) from error


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Update customer details",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Customer not found"},
        status.HTTP_409_CONFLICT: {
            "description": "Customer number already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "description": "Invalid customer details",
        },
    },
)
async def update_customer_details(
    customer_id: int,
    customer_data: CustomerCreate,
    session: DatabaseSession,
    current_user: CurrentUser,
) -> Customer:
    try:
        customer = await session.get(Customer, customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        customer.name = customer_data.name
        customer.number = customer_data.number
        customer.address = customer_data.address
        customer.landmark = customer_data.landmark
        session.add(
            ActivityLog(
                action="edited",
                affected_record=f"Customer — {customer.name}",
                admin_email=current_user.email,
            ),
        )
        await session.commit()
        await session.refresh(customer)
        return customer
    except HTTPException:
        await session.rollback()
        raise
    except IntegrityError as error:
        await session.rollback()
        raise duplicate_number_error() from error
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to update customer details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update customer details",
        ) from error


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete customer details",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Customer not found"},
    },
)
async def delete_customer_details(
    customer_id: int,
    session: DatabaseSession,
    current_user: CurrentUser,
) -> Response:
    try:
        customer = await session.get(Customer, customer_id)
        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        session.add(
            ActivityLog(
                action="deleted",
                affected_record=f"Customer — {customer.name}",
                admin_email=current_user.email,
            ),
        )
        await session.delete(customer)
        await session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to delete customer details")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete customer details",
        ) from error
