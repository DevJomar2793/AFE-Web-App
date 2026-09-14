"""Group sale rows into transactions with multiple items.

Revision ID: 20260914_0007
Revises: 20260908_0006
Create Date: 2026-09-14
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    text,
)


revision: str = "20260914_0007"
down_revision: str | None = "20260908_0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sale_items",
        Column(
            "id",
            Integer(),
            autoincrement=True,
            nullable=False,
            primary_key=True,
        ),
        Column(
            "sale_id",
            Integer(),
            ForeignKey("sales.id", ondelete="CASCADE"),
            nullable=False,
        ),
        Column(
            "inventory_id",
            Integer(),
            ForeignKey("inventory.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        Column("quantity", Integer(), nullable=False),
        Column("price", Numeric(precision=12, scale=2), nullable=False),
        CheckConstraint(
            "quantity > 0",
            name="ck_sale_items_quantity_positive",
        ),
        CheckConstraint(
            "price >= 0",
            name="ck_sale_items_price_non_negative",
        ),
        UniqueConstraint(
            "sale_id",
            "inventory_id",
            name="uq_sale_items_sale_inventory",
        ),
    )
    op.create_index("ix_sale_items_sale_id", "sale_items", ["sale_id"])
    op.create_index("ix_sale_items_inventory_id", "sale_items", ["inventory_id"])

    op.execute(
        text(
            """
            INSERT INTO sale_items (id, sale_id, inventory_id, quantity, price)
            SELECT id, id, inventory_id, quantity, price
            FROM sales
            """,
        ),
    )
    op.execute(
        text(
            """
            WITH grouped_sales AS (
                SELECT customer_name, created_at, MIN(id) AS kept_sale_id
                FROM sales
                GROUP BY customer_name, created_at
                HAVING COUNT(*) > 1
                   AND COUNT(DISTINCT inventory_id) = COUNT(*)
            )
            UPDATE sale_items
            SET sale_id = grouped_sales.kept_sale_id
            FROM sales, grouped_sales
            WHERE sale_items.sale_id = sales.id
              AND sales.customer_name = grouped_sales.customer_name
              AND sales.created_at = grouped_sales.created_at
            """,
        ),
    )
    op.execute(
        text(
            """
            WITH grouped_sales AS (
                SELECT customer_name, created_at, MIN(id) AS kept_sale_id
                FROM sales
                GROUP BY customer_name, created_at
                HAVING COUNT(*) > 1
                   AND COUNT(DISTINCT inventory_id) = COUNT(*)
            )
            DELETE FROM sales
            USING grouped_sales
            WHERE sales.customer_name = grouped_sales.customer_name
              AND sales.created_at = grouped_sales.created_at
              AND sales.id <> grouped_sales.kept_sale_id
            """,
        ),
    )
    op.execute(
        text(
            """
            SELECT setval(
                pg_get_serial_sequence('sale_items', 'id'),
                COALESCE((SELECT MAX(id) FROM sale_items), 1),
                EXISTS (SELECT 1 FROM sale_items)
            )
            """,
        ),
    )

    op.drop_index("ix_sales_inventory_id", table_name="sales")
    op.drop_constraint("ck_sales_quantity_positive", "sales", type_="check")
    op.drop_constraint("ck_sales_price_non_negative", "sales", type_="check")
    op.drop_column("sales", "inventory_id")
    op.drop_column("sales", "quantity")
    op.drop_column("sales", "price")


def downgrade() -> None:
    op.add_column("sales", Column("inventory_id", Integer(), nullable=True))
    op.add_column("sales", Column("quantity", Integer(), nullable=True))
    op.add_column(
        "sales",
        Column("price", Numeric(precision=12, scale=2), nullable=True),
    )

    op.execute(
        text(
            """
            WITH ranked_items AS (
                SELECT
                    sale_id,
                    inventory_id,
                    quantity,
                    price,
                    ROW_NUMBER() OVER (PARTITION BY sale_id ORDER BY id) AS row_number
                FROM sale_items
            )
            UPDATE sales
            SET inventory_id = ranked_items.inventory_id,
                quantity = ranked_items.quantity,
                price = ranked_items.price
            FROM ranked_items
            WHERE sales.id = ranked_items.sale_id
              AND ranked_items.row_number = 1
            """,
        ),
    )
    op.execute(
        text(
            """
            WITH ranked_items AS (
                SELECT
                    sale_id,
                    inventory_id,
                    quantity,
                    price,
                    ROW_NUMBER() OVER (PARTITION BY sale_id ORDER BY id) AS row_number
                FROM sale_items
            )
            INSERT INTO sales (
                inventory_id,
                quantity,
                price,
                customer_name,
                created_at,
                updated_at
            )
            SELECT
                ranked_items.inventory_id,
                ranked_items.quantity,
                ranked_items.price,
                sales.customer_name,
                sales.created_at,
                sales.updated_at
            FROM ranked_items
            JOIN sales ON sales.id = ranked_items.sale_id
            WHERE ranked_items.row_number > 1
            """,
        ),
    )

    op.alter_column("sales", "inventory_id", nullable=False)
    op.alter_column("sales", "quantity", nullable=False)
    op.alter_column("sales", "price", nullable=False)
    op.create_foreign_key(
        "sales_inventory_id_fkey",
        "sales",
        "inventory",
        ["inventory_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_check_constraint(
        "ck_sales_quantity_positive",
        "sales",
        "quantity > 0",
    )
    op.create_check_constraint(
        "ck_sales_price_non_negative",
        "sales",
        "price >= 0",
    )
    op.create_index("ix_sales_inventory_id", "sales", ["inventory_id"])

    op.drop_index("ix_sale_items_inventory_id", table_name="sale_items")
    op.drop_index("ix_sale_items_sale_id", table_name="sale_items")
    op.drop_table("sale_items")
