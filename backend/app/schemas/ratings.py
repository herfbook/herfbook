"""
External ratings schemas — personal reference data only.

Users bookmark industry review scores and links for their own reference.
Per DESIGN.md §7.2, external ratings are never shared to the community layer:
self-hosted instances store scores + links; the M2 community DB will store
links only.

Common sources (not enforced, just documented):
  Cigar Aficionado, Halfwheel, Blind Man's Puff, Cigar Dojo,
  Cigar Coop, Developing Palates, Cigar Federation
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class ExternalRatingCreate(BaseModel):
    source_name: str
    score: Optional[Decimal] = None
    review_url: Optional[str] = None
    review_date: Optional[date] = None
    reviewer_name: Optional[str] = None
    personal_notes: Optional[str] = None

    @field_validator("source_name")
    @classmethod
    def validate_source_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("source_name is required")
        if len(v) > 100:
            raise ValueError("source_name must be 100 characters or fewer")
        return v

    @field_validator("score")
    @classmethod
    def validate_score(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and not (Decimal("0.0") <= v <= Decimal("100.0")):
            raise ValueError("score must be between 0.0 and 100.0")
        return v

    @field_validator("review_url")
    @classmethod
    def validate_review_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            stripped = v.strip()
            if not (stripped.startswith("http://") or stripped.startswith("https://")):
                raise ValueError("review_url must start with http:// or https://")
        return v


class ExternalRatingUpdate(BaseModel):
    source_name: Optional[str] = None
    score: Optional[Decimal] = None
    review_url: Optional[str] = None
    review_date: Optional[date] = None
    reviewer_name: Optional[str] = None
    personal_notes: Optional[str] = None

    @field_validator("source_name")
    @classmethod
    def validate_source_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.strip():
                raise ValueError("source_name cannot be empty")
            if len(v) > 100:
                raise ValueError("source_name must be 100 characters or fewer")
        return v

    @field_validator("score")
    @classmethod
    def validate_score(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and not (Decimal("0.0") <= v <= Decimal("100.0")):
            raise ValueError("score must be between 0.0 and 100.0")
        return v

    @field_validator("review_url")
    @classmethod
    def validate_review_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            stripped = v.strip()
            if not (stripped.startswith("http://") or stripped.startswith("https://")):
                raise ValueError("review_url must start with http:// or https://")
        return v


class ExternalRatingResponse(ExternalRatingCreate):
    id: UUID
    cigar_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
