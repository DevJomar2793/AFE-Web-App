"""Add persisted official receipts and sale customer snapshots.

Revision ID: 20261119_0019
Revises: 20261118_0018
Create Date: 2026-11-19
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


revision: str = "20261119_0019"
down_revision: str | None = "20261118_0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("sales", Column("customer_id", Integer(), nullable=True))
    op.add_column("sales", Column("customer_number", String(11), nullable=True))
    op.add_column("sales", Column("customer_address", String(500), nullable=True))
    op.add_column("sales", Column("customer_landmark", String(500), nullable=True))
    op.create_foreign_key(
        "fk_sales_customer_id",
        "sales",
        "customers",
        ["customer_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_sales_customer_id", "sales", ["customer_id"])

    op.execute(
        """
        UPDATE sales
        SET customer_id = matched.id,
            customer_number = matched.number,
            customer_address = matched.address,
            customer_landmark = matched.landmark
        FROM (
            SELECT lower(trim(name)) AS normalized_name, min(id) AS id,
                   min(number) AS number, min(address) AS address,
                   min(landmark) AS landmark
            FROM customers
            GROUP BY lower(trim(name))
            HAVING count(*) = 1
        ) AS matched
        WHERE lower(trim(sales.customer_name)) = matched.normalized_name
        """,
    )

    op.create_table(
        "official_receipts",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column(
            "sale_id",
            Integer(),
            ForeignKey("sales.id", ondelete="CASCADE"),
            nullable=False,
        ),
        Column("customer_name", String(255), nullable=False),
        Column("customer_number", String(11), nullable=True),
        Column("customer_address", String(500), nullable=True),
        Column("customer_landmark", String(500), nullable=True),
        Column(
            "generated_at",
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
    )
    op.create_index(
        "ix_official_receipts_sale_id",
        "official_receipts",
        ["sale_id"],
        unique=True,
    )

    op.create_table(
        "official_receipt_items",
        Column("id", Integer(), autoincrement=True, nullable=False, primary_key=True),
        Column(
            "receipt_id",
            Integer(),
            ForeignKey("official_receipts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        Column("item_name", String(255), nullable=False),
        Column("item_category", String(10), nullable=False),
        Column("quantity", Integer(), nullable=False),
        Column("unit_price", Numeric(12, 2), nullable=False),
        CheckConstraint(
            "item_category IN ('eggs', 'oil')",
            name="ck_official_receipt_items_category",
        ),
        CheckConstraint(
            "quantity > 0",
            name="ck_official_receipt_items_quantity_positive",
        ),
        CheckConstraint(
            "unit_price >= 0",
            name="ck_official_receipt_items_price_non_negative",
        ),
    )
    op.create_index(
        "ix_official_receipt_items_receipt_id",
        "official_receipt_items",
        ["receipt_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_official_receipt_items_receipt_id",
        table_name="official_receipt_items",
    )
    op.drop_table("official_receipt_items")
    op.drop_index("ix_official_receipts_sale_id", table_name="official_receipts")
    op.drop_table("official_receipts")
    op.drop_index("ix_sales_customer_id", table_name="sales")
    op.drop_constraint("fk_sales_customer_id", "sales", type_="foreignkey")
    op.drop_column("sales", "customer_landmark")
    op.drop_column("sales", "customer_address")
    op.drop_column("sales", "customer_number")
    op.drop_column("sales", "customer_id")
