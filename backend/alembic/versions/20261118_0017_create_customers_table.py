"""Create customers table.

Revision ID: 20261118_0017
Revises: 20261109_0016
Create Date: 2026-11-18
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, text


revision: str = "20261118_0017"
down_revision: str | None = "20261109_0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "customers",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column("name", String(length=255), nullable=False),
        Column("number", String(length=50), nullable=False),
        Column("address", String(length=500), nullable=False),
        Column("landmark", String(length=255), nullable=False),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_customers_name_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(number)) > 0",
            name="ck_customers_number_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(address)) > 0",
            name="ck_customers_address_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(landmark)) > 0",
            name="ck_customers_landmark_not_blank",
        ),
    )


def downgrade() -> None:
    op.drop_table("customers")
