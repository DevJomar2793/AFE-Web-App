"""Add inventory product category and oil size.

Revision ID: 20261106_0015
Revises: 20261105_0014
Create Date: 2026-11-06
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, String, text


revision: str = "20261106_0015"
down_revision: str | None = "20261105_0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("inventory", Column("category", String(length=10), nullable=True))
    op.add_column("inventory", Column("oil_size", String(length=10), nullable=True))

    op.execute(
        "UPDATE inventory SET category = 'oil', oil_size = '1.5L' "
        "WHERE lower(item) LIKE '%oil%' AND lower(item) LIKE '%1.5%'",
    )
    op.execute(
        "UPDATE inventory SET category = 'oil', oil_size = '350ml' "
        "WHERE lower(item) LIKE '%oil%' AND lower(item) LIKE '%350%'",
    )
    op.execute(
        "UPDATE inventory SET category = 'eggs', oil_size = NULL "
        "WHERE category IS NULL",
    )

    op.alter_column(
        "inventory",
        "category",
        nullable=False,
        server_default=text("'eggs'"),
    )
    op.create_check_constraint(
        "ck_inventory_category",
        "inventory",
        "category IN ('eggs', 'oil')",
    )
    op.create_check_constraint(
        "ck_inventory_category_size",
        "inventory",
        "(category = 'eggs' AND oil_size IS NULL) OR "
        "(category = 'oil' AND oil_size IN ('1.5L', '350ml'))",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_inventory_category_size",
        "inventory",
        type_="check",
    )
    op.drop_constraint("ck_inventory_category", "inventory", type_="check")
    op.drop_column("inventory", "oil_size")
    op.drop_column("inventory", "category")
