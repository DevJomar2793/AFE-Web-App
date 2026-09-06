"""Track returned units separately from inventory quantity.

Revision ID: 20260906_0004
Revises: 20260904_0003
Create Date: 2026-09-06
"""

from collections.abc import Sequence

from alembic import op
from sqlalchemy import Column, Integer, text


revision: str = "20260906_0004"
down_revision: str | None = "20260904_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "inventory",
        Column(
            "returns_count",
            Integer(),
            nullable=False,
            server_default=text("0"),
        ),
    )
    op.create_check_constraint(
        "ck_inventory_returns_count_non_negative",
        "inventory",
        "returns_count >= 0",
    )
    op.execute(
        text(
            """
            UPDATE inventory
            SET returns_count = COALESCE(
                (
                    SELECT SUM(returns.quantity)
                    FROM returns
                    WHERE returns.inventory_id = inventory.id
                ),
                0
            )
            """,
        ),
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_inventory_returns_count_non_negative",
        "inventory",
        type_="check",
    )
    op.drop_column("inventory", "returns_count")
