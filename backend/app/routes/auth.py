import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_database_session
from app.models import AuthSession, User
from app.schemas import (
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_refresh_token,
    hash_password,
    verify_password,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(user_data: UserRegister, session: DatabaseSession) -> User:
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        is_active=False,
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
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to register user")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to register user",
        ) from error


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLogin,
    session: DatabaseSession,
) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == login_data.email))
    if user is None or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is waiting for admin approval",
        )

    if not login_data.remember_me:
        return TokenResponse(access_token=create_access_token(user))

    refresh_token = create_refresh_token()
    refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.jwt_refresh_token_expire_days,
    )
    session.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expires_at,
        ),
    )

    try:
        await session.commit()
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to create remembered login session")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create a remembered login session",
        ) from error

    return TokenResponse(
        access_token=create_access_token(user),
        refresh_token=refresh_token,
        refresh_token_expires_at=refresh_token_expires_at,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    refresh_data: RefreshTokenRequest,
    session: DatabaseSession,
) -> TokenResponse:
    auth_session = await session.scalar(
        select(AuthSession)
        .where(
            AuthSession.token_hash
            == hash_refresh_token(refresh_data.refresh_token),
        )
        .with_for_update(),
    )
    if auth_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The remembered session is invalid or has expired",
        )

    now = datetime.now(timezone.utc)
    if auth_session.expires_at <= now:
        await session.delete(auth_session)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The remembered session is invalid or has expired",
        )

    user = await session.scalar(
        select(User).where(User.id == auth_session.user_id),
    )
    if user is None or not user.is_active:
        await session.delete(auth_session)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The remembered session is invalid or has expired",
        )

    new_refresh_token = create_refresh_token()
    auth_session.token_hash = hash_refresh_token(new_refresh_token)

    try:
        await session.commit()
    except SQLAlchemyError as error:
        await session.rollback()
        logger.exception("Failed to refresh remembered login session")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to refresh the login session",
        ) from error

    return TokenResponse(
        access_token=create_access_token(user),
        refresh_token=new_refresh_token,
        refresh_token_expires_at=auth_session.expires_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(
    refresh_data: RefreshTokenRequest,
    session: DatabaseSession,
) -> Response:
    await session.execute(
        delete(AuthSession).where(
            AuthSession.token_hash
            == hash_refresh_token(refresh_data.refresh_token),
        ),
    )
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: CurrentUser) -> User:
    return current_user
