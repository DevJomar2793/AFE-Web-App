"""Create inventory table.

Revision ID: 20260902_0001
Revises:
Create Date: 2026-09-02
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, DateTime, Integer, Numeric, String
from sqlalchemy import text
from sqlalchemy.dialects import postgresql


revision: str = "20260902_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


inventory_status = postgresql.ENUM(
    "in_stock",
    "low_stock",
    "out_of_stock",
    name="inventory_status",
    create_type=False,
)


def upgrade() -> None:
    inventory_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "inventory",
        Column(
            "id",
            Integer(),
            autoincrement=True,
            nullable=False,
            primary_key=True,
        ),
        Column("item", String(length=255), nullable=False),
        Column("quantity", Integer(), server_default=text("0"), nullable=False),
        Column("price", Numeric(precision=12, scale=2), server_default=text("0.00"), nullable=False),
        Column(
            "status",
            inventory_status,
            server_default=text("'out_of_stock'"),
            nullable=False,
        ),
        Column("created_at", DateTime(timezone=True), server_default=text("now()"), nullable=False),
        Column("updated_at", DateTime(timezone=True), server_default=text("now()"), nullable=False),
        CheckConstraint(
            "char_length(trim(item)) > 0",
            name="ck_inventory_item_not_blank",
        ),
        CheckConstraint(
            "quantity >= 0",
            name="ck_inventory_quantity_non_negative",
        ),
        CheckConstraint("price >= 0", name="ck_inventory_price_non_negative"),
        CheckConstraint(
            "(quantity = 0 AND status = 'out_of_stock') OR "
            "(quantity > 0 AND status IN ('in_stock', 'low_stock'))",
            name="ck_inventory_status_matches_quantity",
        ),
    )


def downgrade() -> None:
    op.drop_table("inventory")
    inventory_status.drop(op.get_bind(), checkfirst=True)
