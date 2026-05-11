from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CigarCreate(BaseModel):
    brand_id: UUID
    line_id: Optional[UUID] = None
    vitola_id: Optional[UUID] = None
    custom_vitola_name: Optional[str] = None
    custom_length: Optional[float] = None
    custom_ring_gauge: Optional[int] = None
    wrapper_id: Optional[UUID] = None
    binder_id: Optional[UUID] = None
    country_id: Optional[UUID] = None
    manufacturer_id: Optional[UUID] = None
    strength_id: Optional[UUID] = None
    filler_ids: list[UUID] = []
    upc: Optional[str] = None
    description: Optional[str] = None


class CigarUpdate(BaseModel):
    brand_id: Optional[UUID] = None
    line_id: Optional[UUID] = None
    vitola_id: Optional[UUID] = None
    custom_vitola_name: Optional[str] = None
    custom_length: Optional[float] = None
    custom_ring_gauge: Optional[int] = None
    wrapper_id: Optional[UUID] = None
    binder_id: Optional[UUID] = None
    country_id: Optional[UUID] = None
    manufacturer_id: Optional[UUID] = None
    strength_id: Optional[UUID] = None
    filler_ids: Optional[list[UUID]] = None  # if provided, replaces all fillers
    upc: Optional[str] = None
    description: Optional[str] = None


class CigarImageUpdate(BaseModel):
    is_primary: bool


class FillerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    country: Optional[str] = None
    priming: Optional[str] = None


class CigarImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    image_url: str
    image_type: str
    is_primary: bool
    sort_order: int
    created_at: datetime


class CigarListItem(BaseModel):
    id: UUID
    brand_id: UUID
    brand_name: str
    line_id: Optional[UUID] = None
    line_name: Optional[str] = None
    vitola_id: Optional[UUID] = None
    vitola_name: Optional[str] = None
    vitola_size: Optional[str] = None
    wrapper_id: Optional[UUID] = None
    wrapper_name: Optional[str] = None
    strength_id: Optional[UUID] = None
    strength_name: Optional[str] = None
    country_id: Optional[UUID] = None
    country_name: Optional[str] = None
    primary_image_url: Optional[str] = None
    created_at: datetime


class CigarDetail(CigarListItem):
    custom_vitola_name: Optional[str] = None
    custom_length: Optional[float] = None
    custom_ring_gauge: Optional[int] = None
    binder_id: Optional[UUID] = None
    binder_name: Optional[str] = None
    manufacturer_id: Optional[UUID] = None
    manufacturer_name: Optional[str] = None
    fillers: list[FillerResponse]
    upc: Optional[str] = None
    description: Optional[str] = None
    is_user_created: bool
    submission_status: Optional[str] = None
    images: list[CigarImageResponse]
    updated_at: datetime


class PaginatedCigars(BaseModel):
    items: list[CigarListItem]
    total: int
    offset: int
    limit: int
