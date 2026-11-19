"""Constrain customer details.

Revision ID: 20261118_0018
Revises: 20261118_0017
Create Date: 2026-11-18
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, String


revision: str = "20261118_0018"
down_revision: str | None = "20261118_0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "ck_customers_number_not_blank",
        "customers",
        type_="check",
    )
    op.alter_column(
        "customers",
        "number",
        existing_type=String(length=50),
        type_=String(length=11),
        existing_nullable=False,
    )
    op.alter_column(
        "customers",
        "landmark",
        existing_type=String(length=255),
        type_=String(length=500),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "ck_customers_number_format",
        "customers",
        "number ~ '^[0-9]{11}$'",
    )
    op.create_unique_constraint(
        "uq_customers_number",
        "customers",
        ["number"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_customers_number", "customers", type_="unique")
    op.drop_constraint(
        "ck_customers_number_format",
        "customers",
        type_="check",
    )
    op.alter_column(
        "customers",
        "landmark",
        existing_type=String(length=500),
        type_=String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "customers",
        "number",
        existing_type=String(length=11),
        type_=String(length=50),
        existing_nullable=False,
    )
    op.create_check_constraint(
        "ck_customers_number_not_blank",
        "customers",
        "char_length(trim(number)) > 0",
    )
