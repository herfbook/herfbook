from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar
from app.models.inventory import Inventory
from app.models.user import User
from app.models.want_list import WantList
from app.schemas.want_list import (
    WantListCreate,
    WantListFulfill,
    WantListResponse,
    WantListUpdate,
)

router = APIRouter()


def _cigar_vitola(cigar: Cigar | None) -> str | None:
    if cigar is None:
        return None
    if cigar.vitola:
        return cigar.vitola.name
    return cigar.custom_vitola_name


def _build_response(item: WantList) -> WantListResponse:
    return WantListResponse(
        id=item.id,
        cigar_id=item.cigar_id,
        session_id=item.session_id,
        notes=item.notes,
        priority=item.priority,
        target_price=item.target_price,
        fulfilled=item.fulfilled,
        fulfilled_inventory_id=item.fulfilled_inventory_id,
        created_at=item.created_at,
        cigar_brand=item.cigar.brand.name if item.cigar and item.cigar.brand else None,
        cigar_line=item.cigar.line if item.cigar else None,
        cigar_vitola=_cigar_vitola(item.cigar),
    )


async def _get_item(db: AsyncSession, item_id: UUID, user_id: UUID) -> WantList:
    result = await db.execute(
        select(WantList)
        .options(joinedload(WantList.cigar).joinedload(Cigar.brand), joinedload(WantList.cigar).joinedload(Cigar.vitola))
        .where(WantList.id == item_id, WantList.user_id == user_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Want list item not found")
    return item


@router.post("", response_model=WantListResponse, status_code=status.HTTP_201_CREATED)
async def create_want_list_item(
    body: WantListCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WantListResponse:
    if body.cigar_id is not None:
        cigar_check = await db.execute(
            select(Cigar.id).where(Cigar.id == body.cigar_id, Cigar.user_id == current_user.id)
        )
        if cigar_check.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")

        dup_check = await db.execute(
            select(WantList.id).where(
                WantList.user_id == current_user.id,
                WantList.cigar_id == body.cigar_id,
                WantList.fulfilled == False,  # noqa: E712
            )
        )
        if dup_check.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An unfulfilled want list entry for this cigar already exists",
            )

    item = WantList(
        user_id=current_user.id,
        cigar_id=body.cigar_id,
        notes=body.notes,
        priority=body.priority,
        target_price=body.target_price,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    result = await db.execute(
        select(WantList)
        .options(joinedload(WantList.cigar).joinedload(Cigar.brand), joinedload(WantList.cigar).joinedload(Cigar.vitola))
        .where(WantList.id == item.id)
    )
    item = result.scalar_one()
    return _build_response(item)


@router.get("", response_model=list[WantListResponse])
async def list_want_list(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    priority: Optional[str] = Query(default=None),
    fulfilled: Optional[bool] = Query(default=None),
    cigar_id: Optional[UUID] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[WantListResponse]:
    q = (
        select(WantList)
        .options(joinedload(WantList.cigar).joinedload(Cigar.brand), joinedload(WantList.cigar).joinedload(Cigar.vitola))
        .where(WantList.user_id == current_user.id)
    )

    if priority is not None:
        q = q.where(WantList.priority == priority)
    if fulfilled is not None:
        q = q.where(WantList.fulfilled == fulfilled)
    if cigar_id is not None:
        q = q.where(WantList.cigar_id == cigar_id)

    q = q.order_by(WantList.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(q)
    items = result.scalars().unique().all()
    return [_build_response(item) for item in items]


@router.patch("/{item_id}", response_model=WantListResponse)
async def update_want_list_item(
    item_id: UUID,
    body: WantListUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WantListResponse:
    item = await _get_item(db, item_id, current_user.id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    result = await db.execute(
        select(WantList)
        .options(joinedload(WantList.cigar).joinedload(Cigar.brand), joinedload(WantList.cigar).joinedload(Cigar.vitola))
        .where(WantList.id == item.id)
    )
    item = result.scalar_one()
    return _build_response(item)


@router.post("/{item_id}/fulfill", response_model=WantListResponse)
async def fulfill_want_list_item(
    item_id: UUID,
    body: WantListFulfill,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WantListResponse:
    item = await _get_item(db, item_id, current_user.id)

    if item.fulfilled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Want list item is already fulfilled")

    inv_check = await db.execute(
        select(Inventory.id).where(Inventory.id == body.inventory_id, Inventory.user_id == current_user.id)
    )
    if inv_check.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

    item.fulfilled = True
    item.fulfilled_inventory_id = body.inventory_id
    await db.commit()

    result = await db.execute(
        select(WantList)
        .options(joinedload(WantList.cigar).joinedload(Cigar.brand), joinedload(WantList.cigar).joinedload(Cigar.vitola))
        .where(WantList.id == item.id)
    )
    item = result.scalar_one()
    return _build_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_want_list_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    item = await _get_item(db, item_id, current_user.id)
    await db.delete(item)
    await db.commit()
