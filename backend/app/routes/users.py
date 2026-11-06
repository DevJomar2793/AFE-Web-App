import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.models import ActivityLog, User
from app.schemas import UserResponse
from app.security import get_current_admin


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["user management"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentAdmin = Annotated[User, Depends(get_current_admin)]


@router.get(
    "/pending",
    response_model=list[UserResponse],
    summary="Get accounts waiting for approval",
)
async def get_pending_users(
    session: DatabaseSession,
    _: CurrentAdmin,
) -> list[User]:
    try:
        result = await session.scalars(
            select(User)
            .where(User.is_active.is_(False))
            .order_by(User.created_at, User.id),
        )
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get pending users")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get pending accounts",
        ) from error


@router.patch(
    "/{user_id}/approve",
    response_model=UserResponse,
    summary="Approve a pending account",
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Account not found"},
        status.HTTP_409_CONFLICT: {"description": "Account already approved"},
    },
)
async def approve_user(
    user_id: int,
    session: DatabaseSession,
    current_admin: CurrentAdmin,
) -> User:
    try:
        user = await session.scalar(
            select(User).where(User.id == user_id).with_for_update(),
        )
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )
        if user.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account is already approved",
            )

        user.is_active = True
        session.add(
            ActivityLog(
                action="approved",
                affected_record=f"Account — {user.email}",
                admin_email=current_admin.email,
            ),
        )
        await session.commit()
        await session.refresh(user)
        return user
    except HTTPException:
        await session.rollback()
        raise
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to approve user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to approve account",
        ) from error
