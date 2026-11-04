"""Create activity logs table.

Revision ID: 20261104_0012
Revises: 20260916_0011
Create Date: 2026-11-04
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, text


revision: str = "20261104_0012"
down_revision: str | None = "20260916_0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column("action", String(length=20), nullable=False),
        Column("affected_record", String(length=500), nullable=False),
        Column("admin_email", String(length=255), nullable=False),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        CheckConstraint(
            "action IN ('added', 'edited', 'deleted')",
            name="ck_activity_logs_action",
        ),
    )
    op.create_index(
        "ix_activity_logs_created_at",
        "activity_logs",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_activity_logs_created_at", table_name="activity_logs")
    op.drop_table("activity_logs")
