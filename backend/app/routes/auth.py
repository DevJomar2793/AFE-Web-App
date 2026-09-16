from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user, verify_password
from app.config import settings
from app.database import get_database_session
from app.models import User
from app.schemas import (
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)


router = APIRouter(prefix="/auth", tags=["auth"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required",
        )
    return user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, session: DatabaseSession) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == credentials.email))
    if user is None or not user.is_active or not verify_password(
        credentials.password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenResponse(
        access_token=create_access_token(user),
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(user: CurrentUser) -> User:
    return user


@router.post(
    "/register",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_staff_account(
    account: RegisterRequest,
    _: CurrentAdmin,
    session: DatabaseSession,
) -> User:
    existing_user = await session.scalar(select(User).where(User.email == account.email))
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=account.email,
        password_hash=hash_password(account.password),
        is_active=True,
        is_admin=False,
    )
    session.add(user)

    try:
        await session.commit()
        await session.refresh(user)
        return user
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from error
