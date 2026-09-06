from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SaleCreate(BaseModel):
    inventory_id: int = Field(gt=0, strict=True)
    quantity: int = Field(gt=0, strict=True)
    customer_name: str = Field(min_length=1, max_length=255)

    @field_validator("customer_name", mode="before")
    @classmethod
    def strip_customer_name(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


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
        if isinstance(value, str):
            return value.strip()
        return value


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
