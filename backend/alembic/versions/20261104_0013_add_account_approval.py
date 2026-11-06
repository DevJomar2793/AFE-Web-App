"""Add account approval and administrator access.

Revision ID: 20261104_0013
Revises: 20261104_0012
Create Date: 2026-11-04
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Boolean, CheckConstraint, Column, text


revision: str = "20261104_0013"
down_revision: str | None = "20261104_0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        Column("is_admin", Boolean(), nullable=False, server_default=text("false")),
    )
    op.execute("UPDATE users SET is_admin = true")
    op.alter_column("users", "is_active", server_default=text("false"))

    op.drop_constraint(
        "ck_activity_logs_action",
        "activity_logs",
        type_="check",
    )
    op.create_check_constraint(
        "ck_activity_logs_action",
        "activity_logs",
        "action IN ('added', 'edited', 'deleted', 'approved')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_activity_logs_action",
        "activity_logs",
        type_="check",
    )
    op.create_check_constraint(
        "ck_activity_logs_action",
        "activity_logs",
        "action IN ('added', 'edited', 'deleted')",
    )

    op.alter_column("users", "is_active", server_default=text("true"))
    op.drop_column("users", "is_admin")
