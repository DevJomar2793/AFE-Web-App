"""Add payment method to sales and official receipts.

Revision ID: 20261120_0020
Revises: 20261119_0019
Create Date: 2026-11-20
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, String


revision: str = "20261120_0020"
down_revision: str | None = "20261119_0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "sales",
        Column("payment_method", String(20), nullable=True),
    )
    op.create_check_constraint(
        "ck_sales_payment_method",
        "sales",
        "payment_method IS NULL OR payment_method IN ('gcash', 'cod')",
    )

    op.add_column(
        "official_receipts",
        Column("payment_method", String(20), nullable=True),
    )
    op.create_check_constraint(
        "ck_official_receipts_payment_method",
        "official_receipts",
        "payment_method IS NULL OR payment_method IN ('gcash', 'cod')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_official_receipts_payment_method",
        "official_receipts",
        type_="check",
    )
    op.drop_column("official_receipts", "payment_method")
    op.drop_constraint(
        "ck_sales_payment_method",
        "sales",
        type_="check",
    )
    op.drop_column("sales", "payment_method")
