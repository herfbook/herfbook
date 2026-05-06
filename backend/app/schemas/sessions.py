from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class TastingNoteCreate(BaseModel):
    draw_quality: Optional[Literal["tight", "perfect", "loose"]] = None
    burn_quality: Optional[Literal["even", "uneven", "canoe", "tunnel"]] = None
    ash_color: Optional[Literal["white", "gray", "dark"]] = None
    ash_hold: Optional[Literal["short", "medium", "long", "excellent"]] = None
    strength_first_id: Optional[UUID] = None
    strength_second_id: Optional[UUID] = None
    strength_third_id: Optional[UUID] = None
    flavor_first: Optional[str] = None
    flavor_second: Optional[str] = None
    flavor_third: Optional[str] = None
    overall_notes: Optional[str] = None
    retrohale_notes: Optional[str] = None
    finish: Optional[Literal["short", "medium", "long", "lingering"]] = None


class TastingNoteResponse(TastingNoteCreate):
    id: UUID
    session_id: UUID


class SessionFlavorTagCreate(BaseModel):
    tag_id: UUID
    third: Optional[Literal["first", "second", "third", "all"]] = None


class SessionFlavorTagResponse(BaseModel):
    id: UUID
    tag_id: UUID
    tag_name: str
    tag_category: Optional[str] = None
    third: Optional[str] = None


class PairingCreate(BaseModel):
    type: Literal["drink", "food"]
    name: str
    notes: Optional[str] = None
    rating: Optional[int] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("rating must be between 1 and 5")
        return v


class PairingUpdate(BaseModel):
    type: Optional[Literal["drink", "food"]] = None
    name: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[int] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("rating must be between 1 and 5")
        return v


class PairingResponse(BaseModel):
    id: UUID
    session_id: UUID
    type: str
    name: str
    notes: Optional[str] = None
    rating: Optional[int] = None


class SessionCreate(BaseModel):
    cigar_id: UUID
    inventory_id: Optional[UUID] = None
    smoked_at: datetime
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    environment_id: Optional[UUID] = None
    occasion: Optional[str] = None
    personal_rating: Optional[int] = None
    would_buy_again: Optional[bool] = None
    add_to_want_list: bool = False
    shared_to_community: Optional[bool] = None
    tasting_notes: Optional[TastingNoteCreate] = None
    flavor_tags: Optional[list[SessionFlavorTagCreate]] = None
    pairings: Optional[list[PairingCreate]] = None

    @field_validator("personal_rating")
    @classmethod
    def validate_personal_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("personal_rating must be between 0 and 100")
        return v


class SessionUpdate(BaseModel):
    smoked_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    environment_id: Optional[UUID] = None
    occasion: Optional[str] = None
    personal_rating: Optional[int] = None
    would_buy_again: Optional[bool] = None
    shared_to_community: Optional[bool] = None
    tasting_notes: Optional[TastingNoteCreate] = None

    @field_validator("personal_rating")
    @classmethod
    def validate_personal_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("personal_rating must be between 0 and 100")
        return v


class SessionListResponse(BaseModel):
    id: UUID
    cigar_id: UUID
    smoked_at: datetime
    location: Optional[str] = None
    personal_rating: Optional[int] = None
    would_buy_again: Optional[bool] = None
    cigar_brand: Optional[str] = None
    cigar_line: Optional[str] = None
    cigar_vitola: Optional[str] = None
    created_at: datetime


class SessionResponse(BaseModel):
    id: UUID
    cigar_id: UUID
    inventory_id: Optional[UUID] = None
    smoked_at: datetime
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    environment_id: Optional[UUID] = None
    environment_name: Optional[str] = None
    occasion: Optional[str] = None
    personal_rating: Optional[int] = None
    would_buy_again: Optional[bool] = None
    add_to_want_list: bool
    shared_to_community: bool
    created_at: datetime
    updated_at: datetime
    tasting_notes: Optional[TastingNoteResponse] = None
    flavor_tags: list[SessionFlavorTagResponse] = []
    pairings: list[PairingResponse] = []
    cigar_brand: Optional[str] = None
    cigar_line: Optional[str] = None
    cigar_vitola: Optional[str] = None


class PaginatedSessions(BaseModel):
    items: list[SessionListResponse]
    total: int
    skip: int
    limit: int
