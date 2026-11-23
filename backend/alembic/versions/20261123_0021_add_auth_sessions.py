"""Add remembered authentication sessions.

Revision ID: 20261123_0021
Revises: 20261120_0020
Create Date: 2026-11-23
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, text


revision: str = "20261123_0021"
down_revision: str | None = "20261120_0020"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "auth_sessions",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column(
            "user_id",
            Integer(),
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        Column("token_hash", String(length=64), nullable=False),
        Column("expires_at", DateTime(timezone=True), nullable=False),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index(
        "ix_auth_sessions_token_hash",
        "auth_sessions",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        "ix_auth_sessions_expires_at",
        "auth_sessions",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_auth_sessions_expires_at", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_token_hash", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
