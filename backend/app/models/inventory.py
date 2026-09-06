from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy import Integer, Numeric, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


if TYPE_CHECKING:
    from app.models.transaction import Return, Sale


class InventoryStatus(str, Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(item)) > 0",
            name="ck_inventory_item_not_blank",
        ),
        CheckConstraint("quantity >= 0", name="ck_inventory_quantity_non_negative"),
        CheckConstraint(
            "returns_count >= 0",
            name="ck_inventory_returns_count_non_negative",
        ),
        CheckConstraint("price >= 0", name="ck_inventory_price_non_negative"),
        CheckConstraint(
            "(quantity = 0 AND status = 'out_of_stock') OR "
            "(quantity > 0 AND status IN ('in_stock', 'low_stock'))",
            name="ck_inventory_status_matches_quantity",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    returns_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    status: Mapped[InventoryStatus] = mapped_column(
        SQLAlchemyEnum(
            InventoryStatus,
            name="inventory_status",
            values_callable=lambda status_enum: [status.value for status in status_enum],
        ),
        nullable=False,
        default=InventoryStatus.OUT_OF_STOCK,
        server_default=text("'out_of_stock'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    sales: Mapped[list["Sale"]] = relationship(back_populates="item")
    returns: Mapped[list["Return"]] = relationship(back_populates="item")
