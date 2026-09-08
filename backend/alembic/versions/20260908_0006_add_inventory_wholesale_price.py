"""Add optional wholesale price to inventory.

Revision ID: 20260908_0006
Revises: 20260906_0005
Create Date: 2026-09-08
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Column, Numeric


revision: str = "20260908_0006"
down_revision: str | None = "20260906_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "inventory",
        Column("wholesale_price", Numeric(precision=12, scale=2), nullable=True),
    )
    op.create_check_constraint(
        "ck_inventory_wholesale_price_non_negative",
        "inventory",
        "wholesale_price IS NULL OR wholesale_price >= 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_inventory_wholesale_price_non_negative",
        "inventory",
        type_="check",
    )
    op.drop_column("inventory", "wholesale_price")
