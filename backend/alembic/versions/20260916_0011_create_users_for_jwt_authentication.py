"""Create users for JWT authentication.

Revision ID: 20260916_0011
Revises: 20260916_0010
Create Date: 2026-09-16
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Boolean, Column, DateTime, Integer, String, text


revision: str = "20260916_0011"
down_revision: str | None = "20260916_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column("email", String(length=255), nullable=False, unique=True),
        Column("password_hash", String(length=255), nullable=False),
        Column("is_active", Boolean(), nullable=False, server_default=text("true")),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("users")
