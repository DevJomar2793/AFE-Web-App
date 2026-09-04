"""Create returns table.

Revision ID: 20260904_0003
Revises: 20260903_0002
Create Date: 2026-09-04
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer
from sqlalchemy import String, text


revision: str = "20260904_0003"
down_revision: str | None = "20260903_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "returns",
        Column(
            "id",
            Integer(),
            autoincrement=True,
            nullable=False,
            primary_key=True,
        ),
        Column(
            "inventory_id",
            Integer(),
            ForeignKey("inventory.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        Column("quantity", Integer(), nullable=False),
        Column("customer_name", String(length=255), nullable=False),
        Column("reason", String(length=255), nullable=False),
        Column(
            "created_at",
            DateTime(timezone=True),
            server_default=text("now()"),
            nullable=False,
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            server_default=text("now()"),
            nullable=False,
        ),
        CheckConstraint("quantity > 0", name="ck_returns_quantity_positive"),
        CheckConstraint(
            "char_length(trim(customer_name)) > 0",
            name="ck_returns_customer_name_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(reason)) > 0",
            name="ck_returns_reason_not_blank",
        ),
    )
    op.create_index("ix_returns_inventory_id", "returns", ["inventory_id"])


def downgrade() -> None:
    op.drop_index("ix_returns_inventory_id", table_name="returns")
    op.drop_table("returns")
