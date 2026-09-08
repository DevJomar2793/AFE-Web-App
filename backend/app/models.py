from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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
            "wholesale_price IS NULL OR wholesale_price >= 0",
            name="ck_inventory_wholesale_price_non_negative",
        ),
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
    wholesale_price: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
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


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_sales_quantity_positive"),
        CheckConstraint("price >= 0", name="ck_sales_price_non_negative"),
        CheckConstraint(
            "char_length(trim(customer_name)) > 0",
            name="ck_sales_customer_name_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inventory_id: Mapped[int] = mapped_column(
        ForeignKey("inventory.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
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
    item: Mapped[Inventory] = relationship(back_populates="sales")


class Return(Base):
    __tablename__ = "returns"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_returns_quantity_positive"),
        CheckConstraint(
            "char_length(trim(customer_name)) > 0",
            name="ck_returns_customer_name_not_blank",
        ),
        CheckConstraint(
            "char_length(trim(reason)) > 0",
            name="ck_returns_reason_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inventory_id: Mapped[int] = mapped_column(
        ForeignKey("inventory.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
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
    item: Mapped[Inventory] = relationship(back_populates="returns")
