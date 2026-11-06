"""Create business funds and fund transaction tables.

Revision ID: 20261105_0014
Revises: 20261104_0013
Create Date: 2026-11-05
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Integer, Numeric, String, text


revision: str = "20261105_0014"
down_revision: str | None = "20261104_0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "inventory",
        Column(
            "purchase_cost",
            Numeric(precision=12, scale=2),
            nullable=False,
            server_default=text("0.00"),
        ),
    )
    op.create_check_constraint(
        "ck_inventory_purchase_cost_non_negative",
        "inventory",
        "purchase_cost >= 0",
    )

    op.create_table(
        "business_funds",
        Column("id", Integer(), nullable=False, primary_key=True),
        Column(
            "current_total",
            Numeric(precision=14, scale=2),
            nullable=False,
            server_default=text("0.00"),
        ),
        Column(
            "is_initialized",
            Boolean(),
            nullable=False,
            server_default=text("false"),
        ),
        Column(
            "updated_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        CheckConstraint("id = 1", name="ck_business_funds_single_row"),
    )
    op.execute(
        "INSERT INTO business_funds (id, current_total, is_initialized) "
        "VALUES (1, 0.00, false)",
    )

    op.create_table(
        "fund_transactions",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column("transaction_type", String(length=20), nullable=False),
        Column("source", String(length=30), nullable=False),
        Column("amount", Numeric(precision=14, scale=2), nullable=False),
        Column("description", String(length=255), nullable=False),
        Column("related_sale_id", Integer(), nullable=True),
        Column("related_inventory_id", Integer(), nullable=True),
        Column(
            "created_at",
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        ),
        CheckConstraint(
            "transaction_type IN ('opening_balance', 'income', 'expense')",
            name="ck_fund_transactions_type",
        ),
        CheckConstraint(
            "source IN ('opening_balance', 'manual', 'sale', "
            "'sale_adjustment', 'sale_reversal', 'inventory_purchase')",
            name="ck_fund_transactions_source",
        ),
        CheckConstraint("amount >= 0", name="ck_fund_transactions_amount"),
        CheckConstraint(
            "char_length(trim(description)) > 0",
            name="ck_fund_transactions_description_not_blank",
        ),
    )
    op.create_index(
        "ix_fund_transactions_created_at",
        "fund_transactions",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_fund_transactions_created_at",
        table_name="fund_transactions",
    )
    op.drop_table("fund_transactions")
    op.drop_table("business_funds")
    op.drop_constraint(
        "ck_inventory_purchase_cost_non_negative",
        "inventory",
        type_="check",
    )
    op.drop_column("inventory", "purchase_cost")
