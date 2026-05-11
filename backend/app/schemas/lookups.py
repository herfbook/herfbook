from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LookupBase(BaseModel):
    """Common fields surfaced for all lookup list/create responses."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    source: str
    is_imported: bool
    is_active: bool


class ManufacturerResponse(LookupBase):
    website: Optional[str] = None
    country: Optional[str] = None


class ManufacturerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    website: Optional[str] = Field(None, max_length=500)
    country: Optional[str] = Field(None, max_length=100)


class BrandResponse(LookupBase):
    manufacturer_id: Optional[UUID] = None
    manufacturer_name: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    manufacturer_id: Optional[UUID] = None
    country: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)


class LineResponse(LookupBase):
    brand_id: Optional[UUID] = None
    brand_name: Optional[str] = None


class LineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    brand_id: UUID


class VitolaResponse(LookupBase):
    length_inches: Optional[float] = None
    ring_gauge: Optional[int] = None
    category: Optional[str] = None


class VitolaCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    length_inches: Optional[float] = Field(None, gt=0, lt=20)
    ring_gauge: Optional[int] = Field(None, gt=0, lt=200)
    category: Optional[str] = Field(None, pattern="^(parejo|figurado)$")


class WrapperResponse(LookupBase):
    color_category: Optional[str] = None
    origin_region: Optional[str] = None


class WrapperCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color_category: Optional[str] = Field(None, max_length=30)
    origin_region: Optional[str] = Field(None, max_length=100)


class BinderResponse(LookupBase):
    origin_region: Optional[str] = None


class BinderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    origin_region: Optional[str] = Field(None, max_length=100)


class FillerLookupResponse(LookupBase):
    """Lookup endpoint response for fillers.

    Distinct from `app.schemas.cigars.FillerResponse`, which is the
    nested-on-cigar shape (no community-state fields).
    """
    country: Optional[str] = None
    priming: Optional[str] = None


class FillerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    priming: Optional[str] = Field(None, max_length=50)


class CountryResponse(LookupBase):
    iso_code: Optional[str] = None


class StrengthLevelResponse(LookupBase):
    sort_order: int


class FlavorTagResponse(LookupBase):
    category: Optional[str] = None


class PurchaseTypeResponse(LookupBase):
    pass


class EnvironmentResponse(LookupBase):
    pass
