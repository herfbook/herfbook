from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HumidorCreate(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    target_humidity: Optional[float] = None
    target_temp_f: Optional[float] = None


class HumidorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    target_humidity: Optional[float] = None
    target_temp_f: Optional[float] = None


class HumidorReadingCreate(BaseModel):
    humidity: Optional[float] = None
    temperature_f: Optional[float] = None
    source: Literal["manual", "sensor_api"] = "manual"
    recorded_at: Optional[datetime] = None


class HumidorReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    humidity: Optional[float] = None
    temperature_f: Optional[float] = None
    source: str
    recorded_at: datetime


class HumidorInventoryItem(BaseModel):
    inventory_id: UUID
    cigar_id: UUID
    brand_name: str
    line: Optional[str] = None
    vitola_name: Optional[str] = None
    quantity: int
    date_added_humidor: Optional[date] = None
    days_aging: Optional[int] = None


class HumidorListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    target_humidity: Optional[float] = None
    target_temp_f: Optional[float] = None
    is_active: bool
    created_at: datetime
    cigar_count: int
    total_capacity_used: Optional[float] = None
    latest_reading: Optional[HumidorReadingResponse] = None


class HumidorDetail(HumidorListItem):
    contents: list[HumidorInventoryItem]


class PaginatedReadings(BaseModel):
    items: list[HumidorReadingResponse]
    total: int
    offset: int
    limit: int
