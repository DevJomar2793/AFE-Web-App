"""Create sales table.

Revision ID: 20260903_0002
Revises: 20260902_0001
Create Date: 2026-09-03
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer
from sqlalchemy import String, text


revision: str = "20260903_0002"
down_revision: str | None = "20260902_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sales",
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
        CheckConstraint("quantity > 0", name="ck_sales_quantity_positive"),
        CheckConstraint(
            "char_length(trim(customer_name)) > 0",
            name="ck_sales_customer_name_not_blank",
        ),
    )
    op.create_index("ix_sales_inventory_id", "sales", ["inventory_id"])


def downgrade() -> None:
    op.drop_index("ix_sales_inventory_id", table_name="sales")
    op.drop_table("sales")
