from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models import InventoryStatus


class HealthResponse(BaseModel):
    status: str
    database: str
    database_name: str


class InventoryCreate(BaseModel):
    item: str = Field(min_length=1, max_length=255)
    quantity: int = Field(ge=0, strict=True)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    wholesale_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )
    status: InventoryStatus | None = None

    @model_validator(mode="after")
    def validate_status(self) -> "InventoryCreate":
        self.item = self.item.strip()
        if not self.item:
            raise ValueError("Item must not be blank")

        if self.status is None:
            self.status = (
                InventoryStatus.OUT_OF_STOCK
                if self.quantity == 0
                else InventoryStatus.IN_STOCK
            )
        elif self.quantity == 0 and self.status != InventoryStatus.OUT_OF_STOCK:
            raise ValueError("An item with zero quantity must be out of stock")
        elif self.quantity > 0 and self.status == InventoryStatus.OUT_OF_STOCK:
            raise ValueError("An item with available quantity cannot be out of stock")
        return self


class InventoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quantity: int = Field(ge=0, strict=True)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    wholesale_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
    )


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: str
    quantity: int
    returns_count: int
    price: Decimal
    wholesale_price: Decimal | None
    status: InventoryStatus
    created_at: datetime
    updated_at: datetime


class SaleCreate(BaseModel):
    inventory_id: int = Field(gt=0, strict=True)
    quantity: int = Field(gt=0, strict=True)
    customer_name: str = Field(min_length=1, max_length=255)

    @field_validator("customer_name", mode="before")
    @classmethod
    def strip_customer_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class SaleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    quantity: int = Field(gt=0, strict=True)


class SaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: str


class SaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inventory_id: int
    item: SaleItemResponse
    quantity: int
    price: Decimal
    customer_name: str
    created_at: datetime
    updated_at: datetime


class ReturnCreate(BaseModel):
    inventory_id: int = Field(gt=0, strict=True)
    quantity: int = Field(gt=0, strict=True)
    customer_name: str = Field(min_length=1, max_length=255)
    reason: str = Field(min_length=1, max_length=255)

    @field_validator("customer_name", "reason", mode="before")
    @classmethod
    def strip_text_fields(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class ReturnItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: str


class ReturnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inventory_id: int
    item: ReturnItemResponse
    quantity: int
    customer_name: str
    reason: str
    created_at: datetime
    updated_at: datetime
