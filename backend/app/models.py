from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InventoryStatus(str, Enum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
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


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    __table_args__ = (
        CheckConstraint(
            "action IN ('added', 'edited', 'deleted', 'approved')",
            name="ck_activity_logs_action",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    affected_record: Mapped[str] = mapped_column(String(500), nullable=False)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )


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
            "purchase_cost >= 0",
            name="ck_inventory_purchase_cost_non_negative",
        ),
        CheckConstraint(
            "category IN ('eggs', 'oil')",
            name="ck_inventory_category",
        ),
        CheckConstraint(
            "(category = 'eggs' AND oil_size IS NULL) OR "
            "(category = 'oil' AND oil_size IN ('1.5L', '350ml'))",
            name="ck_inventory_category_size",
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
    purchase_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    category: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="eggs",
        server_default=text("'eggs'"),
    )
    oil_size: Mapped[str | None] = mapped_column(String(10), nullable=True)
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
    sale_items: Mapped[list["SaleItem"]] = relationship(
        back_populates="item",
    )
    returns: Mapped[list["Return"]] = relationship(back_populates="item")
    price_history: Mapped[list["InventoryPriceHistory"]] = relationship(
        back_populates="inventory",
        passive_deletes=True,
    )


class InventoryPriceHistory(Base):
    __tablename__ = "inventory_price_history"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(product_name)) > 0",
            name="ck_inventory_price_history_product_not_blank",
        ),
        CheckConstraint("quantity >= 0", name="ck_inventory_price_history_quantity"),
        CheckConstraint(
            "category IN ('eggs', 'oil')",
            name="ck_inventory_price_history_category",
        ),
        CheckConstraint(
            "(category = 'eggs' AND oil_size IS NULL) OR "
            "(category = 'oil' AND oil_size IN ('1.5L', '350ml'))",
            name="ck_inventory_price_history_category_size",
        ),
        CheckConstraint(
            "event_type IN ('initial', 'stock_added', 'price_update')",
            name="ck_inventory_price_history_event_type",
        ),
        CheckConstraint(
            "change_direction IN ('initial', 'increased', 'decreased', 'unchanged')",
            name="ck_inventory_price_history_direction",
        ),
        CheckConstraint(
            "previous_purchase_cost IS NULL OR previous_purchase_cost >= 0",
            name="ck_inventory_price_history_previous_cost",
        ),
        CheckConstraint(
            "new_purchase_cost >= 0",
            name="ck_inventory_price_history_new_cost",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inventory_id: Mapped[int | None] = mapped_column(
        ForeignKey("inventory.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(10), nullable=False)
    oil_size: Mapped[str | None] = mapped_column(String(10), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    previous_purchase_cost: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    new_purchase_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    price_difference: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    percentage_change: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    change_direction: Mapped[str] = mapped_column(String(20), nullable=False)
    purchase_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    inventory: Mapped[Inventory | None] = relationship(back_populates="price_history")


class Sale(Base):
    __tablename__ = "sales"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(customer_name)) > 0",
            name="ck_sales_customer_name_not_blank",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
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
    items: Mapped[list["SaleItem"]] = relationship(
        back_populates="sale",
        cascade="all, delete-orphan",
        order_by="SaleItem.id",
    )


class SaleItem(Base):
    __tablename__ = "sale_items"
    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_sale_items_quantity_positive",
        ),
        CheckConstraint("price >= 0", name="ck_sale_items_price_non_negative"),
        UniqueConstraint(
            "sale_id",
            "inventory_id",
            name="uq_sale_items_sale_inventory",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    inventory_id: Mapped[int] = mapped_column(
        ForeignKey("inventory.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped[Sale] = relationship(back_populates="items")
    item: Mapped[Inventory] = relationship(back_populates="sale_items")


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


class BusinessFunds(Base):
    __tablename__ = "business_funds"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_business_funds_single_row"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    current_total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default=text("0.00"),
    )
    is_initialized: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class FundTransaction(Base):
    __tablename__ = "fund_transactions"
    __table_args__ = (
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    related_sale_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    related_inventory_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
