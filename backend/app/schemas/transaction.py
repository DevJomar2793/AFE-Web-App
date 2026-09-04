from datetime import datetime

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
