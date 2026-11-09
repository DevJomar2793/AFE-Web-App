"""Create inventory purchase price history.

Revision ID: 20261109_0016
Revises: 20261106_0015
Create Date: 2026-11-09
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    text,
)


revision: str = "20261109_0016"
down_revision: str | None = "20261106_0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "inventory_price_history",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column(
            "inventory_id",
            Integer(),
            ForeignKey("inventory.id", ondelete="SET NULL"),
            nullable=True,
        ),
        Column("product_name", String(length=255), nullable=False),
        Column("category", String(length=10), nullable=False),
        Column("oil_size", String(length=10), nullable=True),
        Column("quantity", Integer(), nullable=False),
        Column("event_type", String(length=20), nullable=False),
        Column("previous_purchase_cost", Numeric(12, 2), nullable=True),
        Column("new_purchase_cost", Numeric(12, 2), nullable=False),
        Column("price_difference", Numeric(12, 2), nullable=True),
        Column("percentage_change", Numeric(12, 2), nullable=True),
        Column("change_direction", String(length=20), nullable=False),
        Column(
            "purchase_date",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        CheckConstraint(
            "char_length(trim(product_name)) > 0",
            name="ck_inventory_price_history_product_not_blank",
        ),
        CheckConstraint(
            "quantity >= 0",
            name="ck_inventory_price_history_quantity",
        ),
        CheckConstraint(
            "category IN ('eggs', 'oil')",
            name="ck_inventory_price_history_category",
        ),
        CheckConstraint(
            "(category = 'eggs' AND oil_size IS NULL) OR "
            "(category = 'oil' AND oil_size IN ('1.5L', '350ml'))",
            name="ck_inventory_price_history_category_size",
        ),
        CheckConstraint(
            "event_type IN ('initial', 'stock_added', 'price_update')",
            name="ck_inventory_price_history_event_type",
        ),
        CheckConstraint(
            "change_direction IN ('initial', 'increased', 'decreased', 'unchanged')",
            name="ck_inventory_price_history_direction",
        ),
        CheckConstraint(
            "previous_purchase_cost IS NULL OR previous_purchase_cost >= 0",
            name="ck_inventory_price_history_previous_cost",
        ),
        CheckConstraint(
            "new_purchase_cost >= 0",
            name="ck_inventory_price_history_new_cost",
        ),
    )
    op.create_index(
        "ix_inventory_price_history_inventory_id",
        "inventory_price_history",
        ["inventory_id"],
    )
    op.create_index(
        "ix_inventory_price_history_purchase_date",
        "inventory_price_history",
        ["purchase_date"],
    )
    op.execute(
        "INSERT INTO inventory_price_history ("
        "inventory_id, product_name, category, oil_size, quantity, event_type, "
        "previous_purchase_cost, new_purchase_cost, price_difference, "
        "percentage_change, change_direction, purchase_date"
        ") SELECT id, item, category, oil_size, quantity, 'initial', NULL, "
        "purchase_cost, NULL, NULL, 'initial', now() FROM inventory",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_inventory_price_history_purchase_date",
        table_name="inventory_price_history",
    )
    op.drop_index(
        "ix_inventory_price_history_inventory_id",
        table_name="inventory_price_history",
    )
    op.drop_table("inventory_price_history")
