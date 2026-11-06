import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_database_session
from app.models import ActivityLog
from app.schemas import ActivityLogResponse
from app.security import get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/activity-logs",
    tags=["activity logs"],
    dependencies=[Depends(get_current_user)],
)
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


@router.get(
    "",
    response_model=list[ActivityLogResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all admin activity logs",
)
async def get_activity_logs(session: DatabaseSession) -> list[ActivityLog]:
    try:
        result = await session.scalars(
            select(ActivityLog).order_by(
                ActivityLog.created_at.desc(),
                ActivityLog.id.desc(),
            ),
        )
        return list(result.all())
    except SQLAlchemyError as error:
        logger.exception("Failed to get activity logs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to get activity logs",
        ) from error
