from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.schemas.sessions import PairingResponse, SessionFlavorTagResponse, TastingNoteResponse

GUEST_PERMISSIONS = ["collection", "journal", "humidors", "want_list", "swap_list"]


class GuestLinkCreate(BaseModel):
    label: Optional[str] = None
    permissions: list[str]
    expires_at: Optional[datetime] = None

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 100:
            raise ValueError("label must be 100 characters or fewer")
        return v

    @field_validator("permissions")
    @classmethod
    def validate_permissions(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("permissions must be a non-empty list")
        invalid = [p for p in v if p not in GUEST_PERMISSIONS]
        if invalid:
            raise ValueError(f"Unknown permissions: {invalid}. Valid: {GUEST_PERMISSIONS}")
        return v


class GuestLinkUpdate(BaseModel):
    label: Optional[str] = None
    permissions: Optional[list[str]] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 100:
            raise ValueError("label must be 100 characters or fewer")
        return v

    @field_validator("permissions")
    @classmethod
    def validate_permissions(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is not None:
            if not v:
                raise ValueError("permissions must be a non-empty list")
            invalid = [p for p in v if p not in GUEST_PERMISSIONS]
            if invalid:
                raise ValueError(f"Unknown permissions: {invalid}. Valid: {GUEST_PERMISSIONS}")
        return v


class GuestLinkResponse(BaseModel):
    id: UUID
    token: str
    label: Optional[str]
    permissions: list[str]
    expires_at: Optional[datetime]
    is_active: bool
    last_accessed: Optional[datetime]
    created_at: datetime
    share_url: str


class GuestCigarResponse(BaseModel):
    id: UUID
    brand_name: Optional[str]
    line: Optional[str]
    vitola_name: Optional[str]
    wrapper_name: Optional[str]
    country_name: Optional[str]
    strength_name: Optional[str]
    humidor_name: Optional[str]
    quantity: int


class GuestSessionResponse(BaseModel):
    id: UUID
    cigar_brand: Optional[str]
    cigar_line: Optional[str]
    cigar_vitola: Optional[str]
    smoked_at: datetime
    duration_minutes: Optional[int]
    location: Optional[str]
    environment_name: Optional[str]
    personal_rating: Optional[int]
    would_buy_again: Optional[bool]
    tasting_notes: Optional[TastingNoteResponse] = None
    flavor_tags: list[SessionFlavorTagResponse] = []
    pairings: list[PairingResponse] = []


class GuestHumidorResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    capacity: Optional[int]
    target_humidity: Optional[Decimal]
    target_temp_f: Optional[Decimal]
    cigars: list[GuestCigarResponse] = []


class GuestWantListResponse(BaseModel):
    id: UUID
    cigar_brand: Optional[str]
    cigar_line: Optional[str]
    cigar_vitola: Optional[str]
    notes: Optional[str]
    priority: Optional[str]


class GuestSwapListResponse(BaseModel):
    id: UUID
    cigar_brand: Optional[str]
    cigar_line: Optional[str]
    cigar_vitola: Optional[str]
    max_quantity: Optional[int]
    notes: Optional[str]
