from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar
from app.models.humidor import Humidor
from app.models.inventory import Inventory, InventoryTransfer
from app.models.lookups import PurchaseType
from app.models.session import SmokingSession
from app.models.user import User
from app.schemas.inventory import (
    HumidorStickCount,
    InventoryCreate,
    InventoryDetail,
    InventoryListItem,
    InventoryStats,
    InventorySmokeRequest,
    InventoryTransferRequest,
    InventoryUpdate,
    PaginatedInventory,
    SmokeResponse,
    TransferResponse,
)

router = APIRouter()

_DETAIL_OPTIONS = [
    joinedload(Inventory.cigar).joinedload(Cigar.brand),
    joinedload(Inventory.cigar).joinedload(Cigar.vitola),
    joinedload(Inventory.humidor),
    joinedload(Inventory.purchase_type),
    selectinload(Inventory.transfers).joinedload(InventoryTransfer.from_humidor),
    selectinload(Inventory.transfers).joinedload(InventoryTransfer.to_humidor),
]

_LIST_OPTIONS = [
    joinedload(Inventory.cigar).joinedload(Cigar.brand),
    joinedload(Inventory.cigar).joinedload(Cigar.vitola),
    joinedload(Inventory.humidor),
    joinedload(Inventory.purchase_type),
]


def _cigar_display_name(cigar: Cigar) -> str:
    brand = cigar.brand.name if cigar.brand else "Unknown"
    line = cigar.line
    vitola = cigar.vitola.name if cigar.vitola else cigar.custom_vitola_name
    if line and vitola:
        return f"{brand} — {line} ({vitola})"
    if line:
        return f"{brand} — {line}"
    if vitola:
        return f"{brand} ({vitola})"
    return brand


def _build_list_item(inv: Inventory, today: date) -> InventoryListItem:
    return InventoryListItem(
        id=inv.id,
        cigar_id=inv.cigar_id,
        cigar_display_name=_cigar_display_name(inv.cigar),
        humidor_id=inv.humidor_id,
        humidor_name=inv.humidor.name if inv.humidor else None,
        quantity=inv.quantity,
        purchase_date=inv.purchase_date,
        purchase_price=float(inv.purchase_price) if inv.purchase_price is not None else None,
        price_per_stick=float(inv.price_per_stick) if inv.price_per_stick is not None else None,
        vendor=inv.vendor,
        purchase_type_name=inv.purchase_type.name if inv.purchase_type else None,
        is_gift=inv.is_gift,
        date_added_humidor=inv.date_added_humidor,
        days_aging=(today - inv.date_added_humidor).days if inv.date_added_humidor else None,
        created_at=inv.created_at,
    )


def _build_detail(inv: Inventory, today: date) -> InventoryDetail:
    sorted_transfers = sorted(inv.transfers, key=lambda t: t.transferred_at, reverse=True)
    transfers = [
        TransferResponse(
            id=t.id,
            from_humidor_id=t.from_humidor_id,
            from_humidor_name=t.from_humidor.name if t.from_humidor else None,
            to_humidor_id=t.to_humidor_id,
            to_humidor_name=t.to_humidor.name if t.to_humidor else None,
            quantity=t.quantity,
            transferred_at=t.transferred_at,
            notes=t.notes,
        )
        for t in sorted_transfers
    ]
    return InventoryDetail(
        id=inv.id,
        cigar_id=inv.cigar_id,
        cigar_display_name=_cigar_display_name(inv.cigar),
        humidor_id=inv.humidor_id,
        humidor_name=inv.humidor.name if inv.humidor else None,
        quantity=inv.quantity,
        purchase_date=inv.purchase_date,
        purchase_price=float(inv.purchase_price) if inv.purchase_price is not None else None,
        price_per_stick=float(inv.price_per_stick) if inv.price_per_stick is not None else None,
        vendor=inv.vendor,
        purchase_type_name=inv.purchase_type.name if inv.purchase_type else None,
        is_gift=inv.is_gift,
        date_added_humidor=inv.date_added_humidor,
        days_aging=(today - inv.date_added_humidor).days if inv.date_added_humidor else None,
        created_at=inv.created_at,
        vendor_url=inv.vendor_url,
        purchase_type_id=inv.purchase_type_id,
        box_code=inv.box_code,
        gift_from=inv.gift_from,
        gift_occasion=inv.gift_occasion,
        gift_to=inv.gift_to,
        notes=inv.notes,
        updated_at=inv.updated_at,
        transfers=transfers,
    )


async def _get_inventory(db: AsyncSession, inventory_id: UUID, user_id: UUID) -> Inventory:
    result = await db.execute(
        select(Inventory)
        .where(Inventory.id == inventory_id, Inventory.user_id == user_id)
        .options(*_DETAIL_OPTIONS)
    )
    inv = result.unique().scalar_one_or_none()
    if inv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    return inv


async def _validate_humidor(db: AsyncSession, humidor_id: UUID, user_id: UUID) -> None:
    result = await db.execute(
        select(Humidor.id).where(Humidor.id == humidor_id, Humidor.user_id == user_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Humidor not found")


async def _validate_purchase_type(db: AsyncSession, purchase_type_id: UUID) -> None:
    result = await db.execute(
        select(PurchaseType.id).where(
            PurchaseType.id == purchase_type_id,
            PurchaseType.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase type not found or inactive",
        )


@router.post("", response_model=InventoryDetail, status_code=status.HTTP_201_CREATED)
async def create_inventory(
    body: InventoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryDetail:
    """Add cigars to inventory."""
    cigar_result = await db.execute(
        select(Cigar.id).where(Cigar.id == body.cigar_id, Cigar.user_id == current_user.id)
    )
    if cigar_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")

    if body.humidor_id is not None:
        await _validate_humidor(db, body.humidor_id, current_user.id)

    if body.purchase_type_id is not None:
        await _validate_purchase_type(db, body.purchase_type_id)

    price_per_stick = body.price_per_stick
    if price_per_stick is None and body.purchase_price is not None and body.quantity:
        price_per_stick = body.purchase_price / body.quantity

    date_added_humidor = body.date_added_humidor
    if body.humidor_id is not None and date_added_humidor is None:
        date_added_humidor = date.today()

    inv = Inventory(
        user_id=current_user.id,
        cigar_id=body.cigar_id,
        humidor_id=body.humidor_id,
        quantity=body.quantity,
        purchase_date=body.purchase_date,
        purchase_price=body.purchase_price,
        price_per_stick=price_per_stick,
        vendor=body.vendor,
        vendor_url=body.vendor_url,
        purchase_type_id=body.purchase_type_id,
        box_code=body.box_code,
        date_added_humidor=date_added_humidor,
        is_gift=body.is_gift,
        gift_from=body.gift_from,
        gift_occasion=body.gift_occasion,
        gift_to=body.gift_to,
        notes=body.notes,
    )
    db.add(inv)
    await db.commit()

    loaded = await _get_inventory(db, inv.id, current_user.id)
    return _build_detail(loaded, date.today())


@router.get("", response_model=PaginatedInventory)
async def list_inventory(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    humidor_id: Optional[UUID] = Query(default=None),
    cigar_id: Optional[UUID] = Query(default=None),
    is_gift: Optional[bool] = Query(default=None),
    min_quantity: Optional[int] = Query(default=None, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedInventory:
    """List inventory with filtering and pagination."""
    filters = [Inventory.user_id == current_user.id]
    if humidor_id is not None:
        filters.append(Inventory.humidor_id == humidor_id)
    if cigar_id is not None:
        filters.append(Inventory.cigar_id == cigar_id)
    if is_gift is not None:
        filters.append(Inventory.is_gift == is_gift)
    if min_quantity is not None:
        filters.append(Inventory.quantity >= min_quantity)

    count_result = await db.execute(
        select(func.count()).select_from(Inventory).where(*filters)
    )
    total = count_result.scalar_one()

    items_result = await db.execute(
        select(Inventory)
        .where(*filters)
        .options(*_LIST_OPTIONS)
        .order_by(Inventory.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = items_result.unique().scalars().all()

    today = date.today()
    return PaginatedInventory(
        items=[_build_list_item(inv, today) for inv in items],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryStats:
    """Aggregate stats across all user inventory."""
    agg_result = await db.execute(
        select(
            func.coalesce(func.sum(Inventory.quantity), 0).label("total_sticks"),
            func.count(Inventory.id).label("total_lots"),
            func.sum(Inventory.price_per_stick * Inventory.quantity).label("total_value"),
            func.coalesce(
                func.sum(
                    case(
                        (Inventory.price_per_stick.is_not(None), Inventory.quantity),
                        else_=0,
                    )
                ),
                0,
            ).label("priced_sticks"),
        ).where(Inventory.user_id == current_user.id)
    )
    row = agg_result.one()
    total_sticks = int(row.total_sticks)
    total_lots = int(row.total_lots)
    total_value = float(row.total_value) if row.total_value is not None else None
    priced_sticks = int(row.priced_sticks)

    avg_price = (total_value / priced_sticks) if (total_value is not None and priced_sticks > 0) else None

    by_humidor_result = await db.execute(
        select(
            Inventory.humidor_id,
            func.sum(Inventory.quantity).label("stick_count"),
        )
        .where(Inventory.user_id == current_user.id)
        .group_by(Inventory.humidor_id)
    )
    humidor_rows = by_humidor_result.all()

    humidor_ids = [r.humidor_id for r in humidor_rows if r.humidor_id is not None]
    humidor_names: dict[UUID, str] = {}
    if humidor_ids:
        h_result = await db.execute(
            select(Humidor.id, Humidor.name).where(Humidor.id.in_(humidor_ids))
        )
        humidor_names = {r.id: r.name for r in h_result.all()}

    sticks_by_humidor = [
        HumidorStickCount(
            humidor_id=r.humidor_id,
            humidor_name=humidor_names.get(r.humidor_id) if r.humidor_id else None,
            stick_count=int(r.stick_count),
        )
        for r in humidor_rows
    ]

    return InventoryStats(
        total_sticks=total_sticks,
        total_value=total_value,
        total_lots=total_lots,
        avg_price_per_stick=avg_price,
        sticks_by_humidor=sticks_by_humidor,
    )


@router.get("/{inventory_id}", response_model=InventoryDetail)
async def get_inventory(
    inventory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryDetail:
    """Get inventory item detail with transfer history."""
    inv = await _get_inventory(db, inventory_id, current_user.id)
    return _build_detail(inv, date.today())


@router.patch("/{inventory_id}", response_model=InventoryDetail)
async def update_inventory(
    inventory_id: UUID,
    body: InventoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryDetail:
    """Update an inventory item."""
    inv = await _get_inventory(db, inventory_id, current_user.id)

    updates = body.model_dump(exclude_unset=True)

    if "humidor_id" in updates and updates["humidor_id"] is not None:
        await _validate_humidor(db, updates["humidor_id"], current_user.id)

    if "purchase_type_id" in updates and updates["purchase_type_id"] is not None:
        await _validate_purchase_type(db, updates["purchase_type_id"])

    for field, value in updates.items():
        setattr(inv, field, value)

    if ("purchase_price" in updates or "quantity" in updates) and "price_per_stick" not in updates:
        if inv.purchase_price is not None and inv.quantity:
            inv.price_per_stick = float(inv.purchase_price) / float(inv.quantity)

    await db.commit()

    loaded = await _get_inventory(db, inv.id, current_user.id)
    return _build_detail(loaded, date.today())


@router.post("/{inventory_id}/transfer", response_model=InventoryDetail)
async def transfer_inventory(
    inventory_id: UUID,
    body: InventoryTransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InventoryDetail:
    """Move inventory between humidors with provenance tracking."""
    inv = await _get_inventory(db, inventory_id, current_user.id)

    if body.to_humidor_id is not None:
        await _validate_humidor(db, body.to_humidor_id, current_user.id)

    if body.quantity > inv.quantity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transfer {body.quantity} sticks; only {inv.quantity} available",
        )

    from_humidor_id = inv.humidor_id
    now = datetime.now(timezone.utc)

    if body.quantity < inv.quantity:
        # Partial transfer: split into a new inventory row for the transferred sticks
        new_inv = Inventory(
            user_id=current_user.id,
            cigar_id=inv.cigar_id,
            humidor_id=body.to_humidor_id,
            quantity=body.quantity,
            purchase_date=inv.purchase_date,
            purchase_price=None,
            price_per_stick=float(inv.price_per_stick) if inv.price_per_stick is not None else None,
            vendor=inv.vendor,
            vendor_url=inv.vendor_url,
            purchase_type_id=inv.purchase_type_id,
            box_code=inv.box_code,
            date_added_humidor=date.today(),
            is_gift=inv.is_gift,
            gift_from=inv.gift_from,
            gift_occasion=inv.gift_occasion,
            gift_to=inv.gift_to,
            notes=inv.notes,
        )
        db.add(new_inv)
        inv.quantity -= body.quantity
    else:
        # Full transfer: update humidor in place
        inv.humidor_id = body.to_humidor_id
        inv.date_added_humidor = date.today()

    transfer = InventoryTransfer(
        inventory_id=inv.id,
        from_humidor_id=from_humidor_id,
        to_humidor_id=body.to_humidor_id,
        quantity=body.quantity,
        transferred_at=now,
        notes=body.notes,
    )
    db.add(transfer)
    await db.commit()

    loaded = await _get_inventory(db, inv.id, current_user.id)
    return _build_detail(loaded, date.today())


@router.post("/{inventory_id}/smoke", response_model=SmokeResponse)
async def smoke_inventory(
    inventory_id: UUID,
    body: InventorySmokeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SmokeResponse:
    """Decrement inventory quantity and create a smoking session stub."""
    inv = await _get_inventory(db, inventory_id, current_user.id)

    if body.quantity > inv.quantity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot smoke {body.quantity} sticks; only {inv.quantity} available",
        )

    inv.quantity -= body.quantity

    session = SmokingSession(
        user_id=current_user.id,
        cigar_id=inv.cigar_id,
        inventory_id=inv.id,
        smoked_at=body.smoked_at or datetime.now(timezone.utc),
        add_to_want_list=False,
        shared_to_community=False,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SmokeResponse(
        inventory_id=inv.id,
        remaining_quantity=inv.quantity,
        smoking_session_id=session.id,
    )
