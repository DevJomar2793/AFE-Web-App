"""Add administrator flag to users.

Revision ID: 20260916_0009
Revises: 20260915_0008
Create Date: 2026-09-16
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Boolean, Column, text


revision: str = "20260916_0009"
down_revision: str | None = "20260915_0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        Column(
            "is_admin",
            Boolean(),
            nullable=False,
            server_default=text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
