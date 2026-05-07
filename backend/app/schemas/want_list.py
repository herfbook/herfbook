from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator


class WantListCreate(BaseModel):
    cigar_id: Optional[UUID] = None
    notes: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    target_price: Optional[Decimal] = None

    @model_validator(mode="after")
    def require_cigar_or_notes(self) -> WantListCreate:
        if self.cigar_id is None and not self.notes:
            raise ValueError("At least one of cigar_id or notes must be provided")
        return self

    @field_validator("target_price")
    @classmethod
    def validate_target_price(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("target_price must be >= 0")
        return v


class WantListUpdate(BaseModel):
    notes: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None
    target_price: Optional[Decimal] = None

    @field_validator("target_price")
    @classmethod
    def validate_target_price(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("target_price must be >= 0")
        return v


class WantListFulfill(BaseModel):
    """Mark a want list item as purchased by linking to an existing inventory entry."""

    inventory_id: UUID


class WantListResponse(BaseModel):
    id: UUID
    cigar_id: Optional[UUID]
    session_id: Optional[UUID]
    notes: Optional[str]
    priority: Optional[str]
    target_price: Optional[Decimal]
    fulfilled: bool
    fulfilled_inventory_id: Optional[UUID]
    created_at: datetime

    cigar_brand: Optional[str] = None
    cigar_line: Optional[str] = None
    cigar_vitola: Optional[str] = None

    model_config = {"from_attributes": True}
