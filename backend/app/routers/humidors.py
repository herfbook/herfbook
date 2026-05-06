from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar
from app.models.humidor import Humidor, HumidorReading
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.humidors import (
    HumidorCreate,
    HumidorDetail,
    HumidorInventoryItem,
    HumidorListItem,
    HumidorReadingCreate,
    HumidorReadingResponse,
    HumidorUpdate,
    PaginatedReadings,
)

router = APIRouter()


async def _get_humidor(db: AsyncSession, humidor_id: UUID, user_id: UUID) -> Humidor:
    result = await db.execute(
        select(Humidor).where(
            Humidor.id == humidor_id,
            Humidor.user_id == user_id,
        )
    )
    humidor = result.scalar_one_or_none()
    if humidor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Humidor not found")
    return humidor


async def _enrich_single(db: AsyncSession, humidor: Humidor, user_id: UUID) -> HumidorListItem:
    """Return a HumidorListItem with cigar count and latest reading for one humidor."""
    count_result = await db.execute(
        select(func.coalesce(func.sum(Inventory.quantity), 0)).where(
            Inventory.humidor_id == humidor.id,
            Inventory.user_id == user_id,
        )
    )
    cigar_count = int(count_result.scalar_one())

    reading_result = await db.execute(
        select(HumidorReading)
        .where(HumidorReading.humidor_id == humidor.id)
        .order_by(HumidorReading.recorded_at.desc())
        .limit(1)
    )
    latest_reading = reading_result.scalar_one_or_none()

    capacity = int(humidor.capacity) if humidor.capacity is not None else None
    total_cap = (float(cigar_count) / float(capacity) * 100) if capacity else None

    return HumidorListItem(
        id=humidor.id,
        name=humidor.name,
        description=humidor.description,
        capacity=capacity,
        location=humidor.location,
        target_humidity=float(humidor.target_humidity) if humidor.target_humidity is not None else None,
        target_temp_f=float(humidor.target_temp_f) if humidor.target_temp_f is not None else None,
        is_active=humidor.is_active,
        created_at=humidor.created_at,
        cigar_count=cigar_count,
        total_capacity_used=total_cap,
        latest_reading=HumidorReadingResponse.model_validate(latest_reading) if latest_reading else None,
    )


@router.post("", response_model=HumidorListItem, status_code=status.HTTP_201_CREATED)
async def create_humidor(
    body: HumidorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HumidorListItem:
    """Create a new humidor for the current user."""
    humidor = Humidor(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        capacity=body.capacity,
        location=body.location,
        target_humidity=body.target_humidity,
        target_temp_f=body.target_temp_f,
    )
    db.add(humidor)
    await db.commit()
    await db.refresh(humidor)
    return await _enrich_single(db, humidor, current_user.id)


@router.get("", response_model=list[HumidorListItem])
async def list_humidors(
    include_archived: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HumidorListItem]:
    """List all humidors for the current user with cigar counts and latest readings."""
    q = select(Humidor).where(Humidor.user_id == current_user.id)
    if not include_archived:
        q = q.where(Humidor.is_active == True)  # noqa: E712

    result = await db.execute(q)
    humidors = result.scalars().all()

    if not humidors:
        return []

    humidor_ids = [h.id for h in humidors]

    # One query for all cigar counts, grouped by humidor
    count_rows = await db.execute(
        select(Inventory.humidor_id, func.sum(Inventory.quantity).label("cnt"))
        .where(
            Inventory.humidor_id.in_(humidor_ids),
            Inventory.user_id == current_user.id,
        )
        .group_by(Inventory.humidor_id)
    )
    counts: dict[UUID, int] = {row.humidor_id: int(row.cnt) for row in count_rows}

    # One query for the latest reading per humidor using a max-recorded_at subquery
    max_sub = (
        select(
            HumidorReading.humidor_id,
            func.max(HumidorReading.recorded_at).label("max_rec"),
        )
        .where(HumidorReading.humidor_id.in_(humidor_ids))
        .group_by(HumidorReading.humidor_id)
        .subquery()
    )
    readings_rows = await db.execute(
        select(HumidorReading).join(
            max_sub,
            (HumidorReading.humidor_id == max_sub.c.humidor_id)
            & (HumidorReading.recorded_at == max_sub.c.max_rec),
        )
    )
    latest_readings: dict[UUID, HumidorReading] = {
        r.humidor_id: r for r in readings_rows.scalars().all()
    }

    items = []
    for h in humidors:
        cigar_count = counts.get(h.id, 0)
        capacity = int(h.capacity) if h.capacity is not None else None
        total_cap = (float(cigar_count) / float(capacity) * 100) if capacity else None
        reading = latest_readings.get(h.id)
        items.append(
            HumidorListItem(
                id=h.id,
                name=h.name,
                description=h.description,
                capacity=capacity,
                location=h.location,
                target_humidity=float(h.target_humidity) if h.target_humidity is not None else None,
                target_temp_f=float(h.target_temp_f) if h.target_temp_f is not None else None,
                is_active=h.is_active,
                created_at=h.created_at,
                cigar_count=cigar_count,
                total_capacity_used=total_cap,
                latest_reading=HumidorReadingResponse.model_validate(reading) if reading else None,
            )
        )
    return items


@router.get("/{humidor_id}", response_model=HumidorDetail)
async def get_humidor(
    humidor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HumidorDetail:
    """Get detailed view of a humidor including its inventory contents."""
    humidor = await _get_humidor(db, humidor_id, current_user.id)

    count_result = await db.execute(
        select(func.coalesce(func.sum(Inventory.quantity), 0)).where(
            Inventory.humidor_id == humidor.id,
            Inventory.user_id == current_user.id,
        )
    )
    cigar_count = int(count_result.scalar_one())

    reading_result = await db.execute(
        select(HumidorReading)
        .where(HumidorReading.humidor_id == humidor.id)
        .order_by(HumidorReading.recorded_at.desc())
        .limit(1)
    )
    latest_reading = reading_result.scalar_one_or_none()

    capacity = int(humidor.capacity) if humidor.capacity is not None else None
    total_cap = (float(cigar_count) / float(capacity) * 100) if capacity else None

    inv_result = await db.execute(
        select(Inventory)
        .where(
            Inventory.humidor_id == humidor.id,
            Inventory.user_id == current_user.id,
        )
        .options(
            joinedload(Inventory.cigar).joinedload(Cigar.brand),
            joinedload(Inventory.cigar).joinedload(Cigar.vitola),
        )
    )
    inventory_items = inv_result.unique().scalars().all()

    today = date.today()
    contents = [
        HumidorInventoryItem(
            inventory_id=inv.id,
            cigar_id=inv.cigar_id,
            brand_name=inv.cigar.brand.name,
            line=inv.cigar.line,
            vitola_name=(
                inv.cigar.vitola.name if inv.cigar.vitola else inv.cigar.custom_vitola_name
            ),
            quantity=inv.quantity,
            date_added_humidor=inv.date_added_humidor,
            days_aging=(today - inv.date_added_humidor).days if inv.date_added_humidor else None,
        )
        for inv in inventory_items
    ]

    return HumidorDetail(
        id=humidor.id,
        name=humidor.name,
        description=humidor.description,
        capacity=capacity,
        location=humidor.location,
        target_humidity=float(humidor.target_humidity) if humidor.target_humidity is not None else None,
        target_temp_f=float(humidor.target_temp_f) if humidor.target_temp_f is not None else None,
        is_active=humidor.is_active,
        created_at=humidor.created_at,
        cigar_count=cigar_count,
        total_capacity_used=total_cap,
        latest_reading=HumidorReadingResponse.model_validate(latest_reading) if latest_reading else None,
        contents=contents,
    )


@router.patch("/{humidor_id}", response_model=HumidorListItem)
async def update_humidor(
    humidor_id: UUID,
    body: HumidorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HumidorListItem:
    """Update a humidor's settings."""
    humidor = await _get_humidor(db, humidor_id, current_user.id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(humidor, field, value)

    await db.commit()
    await db.refresh(humidor)
    return await _enrich_single(db, humidor, current_user.id)


@router.delete("/{humidor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_humidor(
    humidor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft delete a humidor by setting is_active=False."""
    humidor = await _get_humidor(db, humidor_id, current_user.id)
    humidor.is_active = False
    await db.commit()


@router.post(
    "/{humidor_id}/readings",
    response_model=HumidorReadingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reading(
    humidor_id: UUID,
    body: HumidorReadingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HumidorReadingResponse:
    """Add a temperature/humidity reading to a humidor."""
    humidor = await _get_humidor(db, humidor_id, current_user.id)

    reading = HumidorReading(
        humidor_id=humidor.id,
        humidity=body.humidity,
        temperature_f=body.temperature_f,
        source=body.source,
        recorded_at=body.recorded_at or datetime.now(timezone.utc),
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return HumidorReadingResponse.model_validate(reading)


@router.get("/{humidor_id}/readings", response_model=PaginatedReadings)
async def list_readings(
    humidor_id: UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedReadings:
    """List readings for a humidor with pagination and optional date range filter."""
    humidor = await _get_humidor(db, humidor_id, current_user.id)

    base_q = select(HumidorReading).where(HumidorReading.humidor_id == humidor.id)
    if start_date is not None:
        base_q = base_q.where(HumidorReading.recorded_at >= start_date)
    if end_date is not None:
        base_q = base_q.where(HumidorReading.recorded_at <= end_date)

    total_result = await db.execute(select(func.count()).select_from(base_q.subquery()))
    total = total_result.scalar_one()

    items_result = await db.execute(
        base_q.order_by(HumidorReading.recorded_at.desc()).offset(offset).limit(limit)
    )
    items = items_result.scalars().all()

    return PaginatedReadings(
        items=[HumidorReadingResponse.model_validate(r) for r in items],
        total=total,
        offset=offset,
        limit=limit,
    )
