"""Add a unit price snapshot to sales.

Revision ID: 20260906_0005
Revises: 20260906_0004
Create Date: 2026-09-06
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Column, Numeric, text


revision: str = "20260906_0005"
down_revision: str | None = "20260906_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sales",
        Column("price", Numeric(precision=12, scale=2), nullable=True),
    )
    op.execute(
        text(
            """
            UPDATE sales
            SET price = inventory.price
            FROM inventory
            WHERE sales.inventory_id = inventory.id
            """,
        ),
    )
    op.alter_column("sales", "price", nullable=False)
    op.create_check_constraint(
        "ck_sales_price_non_negative",
        "sales",
        "price >= 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_sales_price_non_negative",
        "sales",
        type_="check",
    )
    op.drop_column("sales", "price")
