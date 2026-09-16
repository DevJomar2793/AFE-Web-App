from datetime import UTC, datetime, timedelta
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session_factory, get_database_session
from app.models import User


password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(bearer_scheme),
]


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_password_hash: str) -> bool:
    return password_hash.verify(password, stored_password_hash)


def create_access_token(user: User) -> str:
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    return jwt.encode(
        {
            "sub": str(user.id),
            "email": user.email,
            "exp": expires_at,
        },
        settings.jwt_secret_key.get_secret_value(),
        algorithm="HS256",
    )


async def get_current_user(
    credentials: BearerCredentials,
    session: DatabaseSession,
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=["HS256"],
        )
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise unauthorized from error

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


async def seed_initial_admin() -> None:
    email = settings.initial_admin_email
    password = settings.initial_admin_password
    if email is None or password is None:
        return

    normalized_email = email.strip().lower()
    async with async_session_factory() as session:
        existing_user = await session.scalar(
            select(User).where(User.email == normalized_email)
        )
        if existing_user is not None:
            if not existing_user.is_admin:
                existing_user.is_admin = True
                await session.commit()
            return

        session.add(
            User(
                email=normalized_email,
                password_hash=hash_password(password.get_secret_value()),
                is_active=True,
                is_admin=True,
            )
        )
        await session.commit()
