from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

SWAP_STATUSES = ["proposed", "accepted", "shipped", "received", "completed"]
SWAP_DIRECTIONS = ["outgoing", "incoming"]

SWAP_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "proposed": ["accepted"],
    "accepted": ["shipped"],
    "shipped": ["received"],
    "received": ["completed"],
    "completed": [],
}


class SwapListItemCreate(BaseModel):
    inventory_id: UUID
    max_quantity: Optional[int] = None
    notes: Optional[str] = None


class SwapListItemResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    cigar_brand: Optional[str]
    cigar_line: Optional[str]
    cigar_vitola: Optional[str]
    available_quantity: int
    max_quantity: Optional[int]
    notes: Optional[str]
    is_active: bool
    created_at: datetime


class SwapItemCreate(BaseModel):
    direction: str
    cigar_id: UUID
    inventory_id: Optional[UUID] = None
    quantity: int
    notes: Optional[str] = None

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str) -> str:
        if v not in SWAP_DIRECTIONS:
            raise ValueError(f"direction must be one of {SWAP_DIRECTIONS}")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 1:
            raise ValueError("quantity must be >= 1")
        return v


class SwapItemResponse(BaseModel):
    id: UUID
    direction: str
    cigar_id: UUID
    inventory_id: Optional[UUID]
    quantity: int
    notes: Optional[str]
    cigar_brand: Optional[str]
    cigar_line: Optional[str]


class SwapCreate(BaseModel):
    partner_name: str
    notes: Optional[str] = None
    items: Optional[list[SwapItemCreate]] = None

    @field_validator("partner_name")
    @classmethod
    def validate_partner_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("partner_name is required")
        if len(v) > 200:
            raise ValueError("partner_name must be 200 characters or fewer")
        return v


class SwapUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in SWAP_STATUSES:
            raise ValueError(f"status must be one of {SWAP_STATUSES}")
        return v


class SwapResponse(BaseModel):
    id: UUID
    partner_name: str
    status: str
    notes: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    items: list[SwapItemResponse] = []
