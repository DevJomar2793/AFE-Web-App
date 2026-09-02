import logging

from asyncpg import PostgresError
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine


logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    database: str
    database_name: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Check API and database availability",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": "PostgreSQL is unavailable",
        },
    },
)
async def health_check() -> HealthResponse:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
            database_name = await connection.scalar(text("SELECT current_database()"))
    except (OSError, PostgresError, SQLAlchemyError) as error:
        logger.exception("PostgreSQL health check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from error

    return HealthResponse(
        status="ok",
        database="connected",
        database_name=str(database_name),
    )
