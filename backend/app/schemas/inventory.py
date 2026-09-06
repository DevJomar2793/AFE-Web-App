from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import InventoryStatus


class InventoryCreate(BaseModel):
    item: str = Field(min_length=1, max_length=255)
    quantity: int = Field(ge=0, strict=True)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
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


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: str
    quantity: int
    returns_count: int
    price: Decimal
    status: InventoryStatus
    created_at: datetime
    updated_at: datetime
