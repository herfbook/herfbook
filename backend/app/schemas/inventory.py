from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class InventoryCreate(BaseModel):
    cigar_id: UUID
    humidor_id: Optional[UUID] = None
    quantity: int
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    price_per_stick: Optional[float] = None
    vendor: Optional[str] = None
    vendor_url: Optional[str] = None
    purchase_type_id: Optional[UUID] = None
    box_code: Optional[str] = None
    date_added_humidor: Optional[date] = None
    is_gift: bool = False
    gift_from: Optional[str] = None
    gift_occasion: Optional[str] = None
    gift_to: Optional[str] = None
    notes: Optional[str] = None


class InventoryUpdate(BaseModel):
    humidor_id: Optional[UUID] = None
    quantity: Optional[int] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    price_per_stick: Optional[float] = None
    vendor: Optional[str] = None
    vendor_url: Optional[str] = None
    purchase_type_id: Optional[UUID] = None
    box_code: Optional[str] = None
    date_added_humidor: Optional[date] = None
    is_gift: Optional[bool] = None
    gift_from: Optional[str] = None
    gift_occasion: Optional[str] = None
    gift_to: Optional[str] = None
    notes: Optional[str] = None


class InventoryTransferRequest(BaseModel):
    to_humidor_id: Optional[UUID]
    quantity: int
    notes: Optional[str] = None


class InventorySmokeRequest(BaseModel):
    quantity: int = 1
    smoked_at: Optional[datetime] = None


class TransferResponse(BaseModel):
    id: UUID
    from_humidor_id: Optional[UUID] = None
    from_humidor_name: Optional[str] = None
    to_humidor_id: Optional[UUID] = None
    to_humidor_name: Optional[str] = None
    quantity: int
    transferred_at: datetime
    notes: Optional[str] = None


class InventoryListItem(BaseModel):
    id: UUID
    cigar_id: UUID
    cigar_display_name: str
    humidor_id: Optional[UUID] = None
    humidor_name: Optional[str] = None
    quantity: int
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    price_per_stick: Optional[float] = None
    vendor: Optional[str] = None
    purchase_type_name: Optional[str] = None
    is_gift: bool
    date_added_humidor: Optional[date] = None
    days_aging: Optional[int] = None
    created_at: datetime


class InventoryDetail(InventoryListItem):
    vendor_url: Optional[str] = None
    purchase_type_id: Optional[UUID] = None
    box_code: Optional[str] = None
    gift_from: Optional[str] = None
    gift_occasion: Optional[str] = None
    gift_to: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime
    transfers: list[TransferResponse]


class SmokeResponse(BaseModel):
    inventory_id: UUID
    remaining_quantity: int
    smoking_session_id: UUID


class HumidorStickCount(BaseModel):
    humidor_id: Optional[UUID] = None
    humidor_name: Optional[str] = None
    stick_count: int


class InventoryStats(BaseModel):
    total_sticks: int
    total_value: Optional[float] = None
    total_lots: int
    avg_price_per_stick: Optional[float] = None
    sticks_by_humidor: list[HumidorStickCount]


class PaginatedInventory(BaseModel):
    items: list[InventoryListItem]
    total: int
    offset: int
    limit: int
