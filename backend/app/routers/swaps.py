from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar
from app.models.guest import Swap, SwapItem, SwapListItem
from app.models.inventory import Inventory
from app.models.user import User
from app.schemas.swaps import (
    SWAP_STATUS_TRANSITIONS,
    SwapCreate,
    SwapItemCreate,
    SwapItemResponse,
    SwapListItemCreate,
    SwapListItemResponse,
    SwapResponse,
    SwapUpdate,
)
from app.services import swap_service

router = APIRouter()


def _cigar_vitola(cigar) -> Optional[str]:
    if cigar is None:
        return None
    if cigar.vitola:
        return cigar.vitola.name
    return cigar.custom_vitola_name


def _build_swap_item_response(item: SwapItem) -> SwapItemResponse:
    return SwapItemResponse(
        id=item.id,
        direction=item.direction,
        cigar_id=item.cigar_id,
        inventory_id=item.inventory_id,
        quantity=item.quantity,
        notes=item.notes,
        cigar_brand=item.cigar.brand.name if item.cigar and item.cigar.brand else None,
        cigar_line=item.cigar.line.name if item.cigar and item.cigar.line else None,
    )


def _build_swap_response(swap: Swap) -> SwapResponse:
    return SwapResponse(
        id=swap.id,
        partner_name=swap.partner_name,
        status=swap.status,
        notes=swap.notes,
        created_at=swap.created_at,
        completed_at=swap.completed_at,
        items=[_build_swap_item_response(i) for i in swap.items],
    )


_SWAP_LOAD_OPTIONS = [
    selectinload(Swap.items).options(
        joinedload(SwapItem.cigar).joinedload(Cigar.brand),
        joinedload(SwapItem.cigar).joinedload(Cigar.vitola),
    )
]


async def _get_swap_or_404(db: AsyncSession, swap_id: UUID, user_id: UUID) -> Swap:
    result = await db.execute(
        select(Swap)
        .where(Swap.id == swap_id, Swap.user_id == user_id)
        .options(*_SWAP_LOAD_OPTIONS)
    )
    swap = result.unique().scalar_one_or_none()
    if swap is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Swap not found")
    return swap


# --- Swap List Management ---

@router.post("/list", response_model=SwapListItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_swap_list(
    body: SwapListItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwapListItemResponse:
    inv_result = await db.execute(
        select(Inventory)
        .where(Inventory.id == body.inventory_id, Inventory.user_id == current_user.id)
        .options(
            joinedload(Inventory.cigar).joinedload(Cigar.brand),
            joinedload(Inventory.cigar).joinedload(Cigar.vitola),
        )
    )
    inv = inv_result.unique().scalar_one_or_none()
    if inv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    if inv.quantity < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Inventory item has no available quantity",
        )

    existing = await db.execute(
        select(SwapListItem.id).where(
            SwapListItem.inventory_id == body.inventory_id,
            SwapListItem.user_id == current_user.id,
            SwapListItem.is_active == True,  # noqa: E712
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This inventory item is already on your swap list",
        )

    item = SwapListItem(
        user_id=current_user.id,
        inventory_id=body.inventory_id,
        max_quantity=body.max_quantity,
        notes=body.notes,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return SwapListItemResponse(
        id=item.id,
        inventory_id=item.inventory_id,
        cigar_brand=inv.cigar.brand.name if inv.cigar and inv.cigar.brand else None,
        cigar_line=inv.cigar.line.name if inv.cigar and inv.cigar.line else None,
        cigar_vitola=_cigar_vitola(inv.cigar),
        available_quantity=inv.quantity,
        max_quantity=item.max_quantity,
        notes=item.notes,
        is_active=item.is_active,
        created_at=item.created_at,
    )


@router.get("/list", response_model=list[SwapListItemResponse])
async def get_swap_list(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SwapListItemResponse]:
    result = await db.execute(
        select(SwapListItem)
        .where(
            SwapListItem.user_id == current_user.id,
            SwapListItem.is_active == True,  # noqa: E712
        )
        .options(
            joinedload(SwapListItem.inventory).options(
                joinedload(Inventory.cigar).joinedload(Cigar.brand),
                joinedload(Inventory.cigar).joinedload(Cigar.vitola),
            )
        )
        .order_by(SwapListItem.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.unique().scalars().all()

    return [
        SwapListItemResponse(
            id=item.id,
            inventory_id=item.inventory_id,
            cigar_brand=item.inventory.cigar.brand.name if item.inventory.cigar.brand else None,
            cigar_line=item.inventory.cigar.line.name if item.inventory.cigar.line else None,
            cigar_vitola=_cigar_vitola(item.inventory.cigar),
            available_quantity=item.inventory.quantity,
            max_quantity=item.max_quantity,
            notes=item.notes,
            is_active=item.is_active,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.delete("/list/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_swap_list(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(SwapListItem).where(
            SwapListItem.id == item_id,
            SwapListItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Swap list item not found")
    item.is_active = False
    await db.commit()


# --- Swap Tracking ---

@router.post("", response_model=SwapResponse, status_code=status.HTTP_201_CREATED)
async def create_swap(
    body: SwapCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwapResponse:
    swap = Swap(
        user_id=current_user.id,
        partner_name=body.partner_name,
        status="proposed",
        notes=body.notes,
    )
    db.add(swap)
    await db.flush()

    if body.items:
        for item_data in body.items:
            if item_data.direction == "outgoing" and item_data.inventory_id is not None:
                inv_check = await db.execute(
                    select(Inventory.id).where(
                        Inventory.id == item_data.inventory_id,
                        Inventory.user_id == current_user.id,
                    )
                )
                if inv_check.scalar_one_or_none() is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Inventory item {item_data.inventory_id} not found",
                    )
            db.add(SwapItem(
                swap_id=swap.id,
                direction=item_data.direction,
                cigar_id=item_data.cigar_id,
                inventory_id=item_data.inventory_id,
                quantity=item_data.quantity,
                notes=item_data.notes,
            ))

    await db.commit()
    return _build_swap_response(await _get_swap_or_404(db, swap.id, current_user.id))


@router.get("", response_model=list[SwapResponse])
async def list_swaps(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    partner_name: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SwapResponse]:
    filters = [Swap.user_id == current_user.id]
    if status_filter is not None:
        filters.append(Swap.status == status_filter)
    if partner_name is not None:
        filters.append(Swap.partner_name.ilike(f"%{partner_name}%"))

    result = await db.execute(
        select(Swap)
        .where(*filters)
        .options(*_SWAP_LOAD_OPTIONS)
        .order_by(Swap.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    swaps = result.unique().scalars().all()
    return [_build_swap_response(s) for s in swaps]


@router.get("/{swap_id}", response_model=SwapResponse)
async def get_swap(
    swap_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwapResponse:
    return _build_swap_response(await _get_swap_or_404(db, swap_id, current_user.id))


@router.patch("/{swap_id}", response_model=SwapResponse)
async def update_swap_status(
    swap_id: UUID,
    body: SwapUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwapResponse:
    swap = await _get_swap_or_404(db, swap_id, current_user.id)

    valid_next = SWAP_STATUS_TRANSITIONS.get(swap.status, [])
    if body.status not in valid_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{swap.status}' to '{body.status}'. Valid next: {valid_next}",
        )

    if body.status == "completed":
        await swap_service.complete_swap(db, swap, current_user.id)
    else:
        swap.status = body.status
        await db.commit()

    return _build_swap_response(await _get_swap_or_404(db, swap_id, current_user.id))


@router.post("/{swap_id}/items", response_model=SwapItemResponse, status_code=status.HTTP_201_CREATED)
async def add_swap_item(
    swap_id: UUID,
    body: SwapItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SwapItemResponse:
    swap = await _get_swap_or_404(db, swap_id, current_user.id)

    if swap.status not in ("proposed", "accepted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add items to a swap that has been shipped, received, or completed",
        )

    if body.direction == "outgoing" and body.inventory_id is not None:
        inv_check = await db.execute(
            select(Inventory.id).where(
                Inventory.id == body.inventory_id,
                Inventory.user_id == current_user.id,
            )
        )
        if inv_check.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found",
            )

    item = SwapItem(
        swap_id=swap_id,
        direction=body.direction,
        cigar_id=body.cigar_id,
        inventory_id=body.inventory_id,
        quantity=body.quantity,
        notes=body.notes,
    )
    db.add(item)
    await db.commit()

    item_result = await db.execute(
        select(SwapItem)
        .where(SwapItem.id == item.id)
        .options(
            joinedload(SwapItem.cigar).joinedload(Cigar.brand),
            joinedload(SwapItem.cigar).joinedload(Cigar.vitola),
        )
    )
    loaded_item = item_result.unique().scalar_one()
    return _build_swap_item_response(loaded_item)
