"""Lookup table API.

GET /lookups/{table}            — search/list active+imported entries
POST /lookups/{table}           — create a user-source entry (six tables)

User-creatable tables: manufacturers, brands, vitolas, wrappers, binders, fillers.
Read-only tables: countries, strength-levels, flavor-tags, purchase-types, environments.

All GET endpoints filter on is_active=TRUE AND is_imported=TRUE so the frontend
combobox only sees approved entries. POST creates rows with source="user",
is_imported=True, is_active=True so they're immediately FK-eligible per
the contract enforced in `cigars.py::_validate_lookup`.
"""
from __future__ import annotations

from typing import Any, Optional, Type
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.lookups import (
    Binder,
    Brand,
    Country,
    Environment,
    Filler,
    FlavorTag,
    Line,
    Manufacturer,
    PurchaseType,
    StrengthLevel,
    Vitola,
    Wrapper,
)
from app.models.user import User
from app.schemas.lookups import (
    BinderCreate,
    BinderResponse,
    BrandCreate,
    BrandResponse,
    CountryResponse,
    EnvironmentResponse,
    FillerCreate,
    FillerLookupResponse,
    FlavorTagResponse,
    LineCreate,
    LineResponse,
    ManufacturerCreate,
    ManufacturerResponse,
    PurchaseTypeResponse,
    StrengthLevelResponse,
    VitolaCreate,
    VitolaResponse,
    WrapperCreate,
    WrapperResponse,
)


router = APIRouter()


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


async def _query_lookup_list(
    db: AsyncSession,
    model: Type,
    q: Optional[str],
    limit: int,
    *,
    order_by: Any | None = None,
    extra_options: list | None = None,
) -> list:
    stmt = select(model).where(
        model.is_active.is_(True),
        model.is_imported.is_(True),
    )
    if q:
        stmt = stmt.where(model.name.ilike(f"%{q}%"))
    if order_by is not None:
        stmt = stmt.order_by(order_by)
    else:
        stmt = stmt.order_by(model.name.asc())
    if extra_options:
        for opt in extra_options:
            stmt = stmt.options(opt)
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


def _duplicate_response(existing_id: UUID, table_label: str) -> JSONResponse:
    """Build the 409 body the frontend expects: a flat object so the
    combobox can read .existing_id directly.
    """
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": f"A {table_label} with this name already exists",
            "existing_id": str(existing_id),
        },
    )


async def _find_active_duplicate(
    db: AsyncSession,
    model: Type,
    name: str,
):
    return (
        await db.execute(
            select(model).where(
                func.lower(model.name) == name.lower(),
                model.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()


async def _create_user_lookup(
    db: AsyncSession,
    model: Type,
    name: str,
    extra_fields: dict | None = None,
):
    row = model(
        name=name,
        source="user",
        community_key=None,
        is_imported=True,
        is_active=True,
    )
    if extra_fields:
        for field, value in extra_fields.items():
            setattr(row, field, value)
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


# ---------------------------------------------------------------------------
# Manufacturers
# ---------------------------------------------------------------------------


@router.get("/manufacturers", response_model=list[ManufacturerResponse])
async def list_manufacturers(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[ManufacturerResponse]:
    rows = await _query_lookup_list(db, Manufacturer, q, limit)
    return [ManufacturerResponse.model_validate(r) for r in rows]


@router.post(
    "/manufacturers",
    response_model=ManufacturerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_manufacturer(
    body: ManufacturerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Manufacturer, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "manufacturer")
    row = await _create_user_lookup(
        db,
        Manufacturer,
        body.name,
        extra_fields={"website": body.website, "country": body.country},
    )
    return ManufacturerResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Brands
# ---------------------------------------------------------------------------


def _brand_to_response(row: Brand) -> BrandResponse:
    return BrandResponse(
        id=row.id,
        name=row.name,
        source=row.source,
        is_imported=row.is_imported,
        is_active=row.is_active,
        manufacturer_id=row.manufacturer_id,
        manufacturer_name=row.manufacturer.name if row.manufacturer else None,
        country=row.country,
        website=row.website,
    )


@router.get("/brands", response_model=list[BrandResponse])
async def list_brands(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[BrandResponse]:
    rows = await _query_lookup_list(
        db,
        Brand,
        q,
        limit,
        extra_options=[selectinload(Brand.manufacturer)],
    )
    return [_brand_to_response(r) for r in rows]


@router.post(
    "/brands",
    response_model=BrandResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_brand(
    body: BrandCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Brand, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "brand")
    if body.manufacturer_id is not None:
        manufacturer = (
            await db.execute(
                select(Manufacturer).where(
                    Manufacturer.id == body.manufacturer_id,
                    Manufacturer.is_imported.is_(True),
                    Manufacturer.is_active.is_(True),
                )
            )
        ).scalar_one_or_none()
        if manufacturer is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Manufacturer not found or not active",
            )
    row = await _create_user_lookup(
        db,
        Brand,
        body.name,
        extra_fields={
            "manufacturer_id": body.manufacturer_id,
            "country": body.country,
            "website": body.website,
        },
    )
    # Re-load with manufacturer eager-loaded for the response.
    result = await db.execute(
        select(Brand)
        .where(Brand.id == row.id)
        .options(selectinload(Brand.manufacturer))
    )
    row = result.scalar_one()
    return _brand_to_response(row)


# ---------------------------------------------------------------------------
# Lines (brand-scoped)
# ---------------------------------------------------------------------------


def _line_to_response(row: Line) -> LineResponse:
    return LineResponse(
        id=row.id,
        name=row.name,
        source=row.source,
        is_imported=row.is_imported,
        is_active=row.is_active,
        brand_id=row.brand_id,
        brand_name=row.brand.name if row.brand else None,
    )


@router.get("/lines", response_model=list[LineResponse])
async def list_lines(
    brand_id: UUID = Query(..., description="Required — lines are scoped by brand"),
    q: Optional[str] = Query(default=None, max_length=200),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[LineResponse]:
    stmt = (
        select(Line)
        .where(
            Line.brand_id == brand_id,
            Line.is_active.is_(True),
            Line.is_imported.is_(True),
        )
        .options(selectinload(Line.brand))
        .order_by(Line.name.asc())
        .limit(limit)
    )
    if q:
        stmt = stmt.where(Line.name.ilike(f"%{q}%"))
    rows = (await db.execute(stmt)).scalars().all()
    return [_line_to_response(r) for r in rows]


@router.post(
    "/lines",
    response_model=LineResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_line(
    body: LineCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brand = (
        await db.execute(
            select(Brand).where(
                Brand.id == body.brand_id,
                Brand.is_imported.is_(True),
                Brand.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if brand is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Brand not found or not active",
        )

    # Duplicate detection scoped by brand: same line name on different
    # brands is allowed (multiple brands have "Connecticut", "Maduro", etc.).
    existing = (
        await db.execute(
            select(Line).where(
                func.lower(Line.name) == body.name.lower(),
                Line.brand_id == body.brand_id,
                Line.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "detail": "A line with this name already exists for this brand",
                "existing_id": str(existing.id),
            },
        )

    row = Line(
        name=body.name,
        source="user",
        community_key=None,
        is_imported=True,
        is_active=True,
        brand_id=body.brand_id,
    )
    db.add(row)
    await db.commit()
    # Re-load with brand eager-loaded for the response.
    result = await db.execute(
        select(Line).where(Line.id == row.id).options(selectinload(Line.brand))
    )
    row = result.scalar_one()
    return _line_to_response(row)


# ---------------------------------------------------------------------------
# Vitolas
# ---------------------------------------------------------------------------


def _vitola_to_response(row: Vitola) -> VitolaResponse:
    return VitolaResponse(
        id=row.id,
        name=row.name,
        source=row.source,
        is_imported=row.is_imported,
        is_active=row.is_active,
        length_inches=float(row.length_inches) if row.length_inches is not None else None,
        ring_gauge=row.ring_gauge,
        category=row.category,
    )


@router.get("/vitolas", response_model=list[VitolaResponse])
async def list_vitolas(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[VitolaResponse]:
    rows = await _query_lookup_list(db, Vitola, q, limit)
    return [_vitola_to_response(r) for r in rows]


@router.post(
    "/vitolas",
    response_model=VitolaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_vitola(
    body: VitolaCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Vitola, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "vitola")
    row = await _create_user_lookup(
        db,
        Vitola,
        body.name,
        extra_fields={
            "length_inches": body.length_inches,
            "ring_gauge": body.ring_gauge,
            "category": body.category,
        },
    )
    return _vitola_to_response(row)


# ---------------------------------------------------------------------------
# Wrappers
# ---------------------------------------------------------------------------


@router.get("/wrappers", response_model=list[WrapperResponse])
async def list_wrappers(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[WrapperResponse]:
    rows = await _query_lookup_list(db, Wrapper, q, limit)
    return [WrapperResponse.model_validate(r) for r in rows]


@router.post(
    "/wrappers",
    response_model=WrapperResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_wrapper(
    body: WrapperCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Wrapper, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "wrapper")
    row = await _create_user_lookup(
        db,
        Wrapper,
        body.name,
        extra_fields={
            "color_category": body.color_category,
            "origin_region": body.origin_region,
        },
    )
    return WrapperResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Binders
# ---------------------------------------------------------------------------


@router.get("/binders", response_model=list[BinderResponse])
async def list_binders(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[BinderResponse]:
    rows = await _query_lookup_list(db, Binder, q, limit)
    return [BinderResponse.model_validate(r) for r in rows]


@router.post(
    "/binders",
    response_model=BinderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_binder(
    body: BinderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Binder, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "binder")
    row = await _create_user_lookup(
        db,
        Binder,
        body.name,
        extra_fields={"origin_region": body.origin_region},
    )
    return BinderResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Fillers
# ---------------------------------------------------------------------------


@router.get("/fillers", response_model=list[FillerLookupResponse])
async def list_fillers(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[FillerLookupResponse]:
    rows = await _query_lookup_list(db, Filler, q, limit)
    return [FillerLookupResponse.model_validate(r) for r in rows]


@router.post(
    "/fillers",
    response_model=FillerLookupResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_filler(
    body: FillerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await _find_active_duplicate(db, Filler, body.name)
    if existing is not None:
        return _duplicate_response(existing.id, "filler")
    row = await _create_user_lookup(
        db,
        Filler,
        body.name,
        extra_fields={"country": body.country, "priming": body.priming},
    )
    return FillerLookupResponse.model_validate(row)


# ---------------------------------------------------------------------------
# Read-only tables
# ---------------------------------------------------------------------------


@router.get("/countries", response_model=list[CountryResponse])
async def list_countries(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[CountryResponse]:
    rows = await _query_lookup_list(db, Country, q, limit)
    return [CountryResponse.model_validate(r) for r in rows]


@router.get("/strength-levels", response_model=list[StrengthLevelResponse])
async def list_strength_levels(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[StrengthLevelResponse]:
    rows = await _query_lookup_list(
        db,
        StrengthLevel,
        q,
        limit,
        order_by=StrengthLevel.sort_order.asc(),
    )
    return [StrengthLevelResponse.model_validate(r) for r in rows]


@router.get("/flavor-tags", response_model=list[FlavorTagResponse])
async def list_flavor_tags(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[FlavorTagResponse]:
    rows = await _query_lookup_list(db, FlavorTag, q, limit)
    return [FlavorTagResponse.model_validate(r) for r in rows]


@router.get("/purchase-types", response_model=list[PurchaseTypeResponse])
async def list_purchase_types(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[PurchaseTypeResponse]:
    rows = await _query_lookup_list(db, PurchaseType, q, limit)
    return [PurchaseTypeResponse.model_validate(r) for r in rows]


@router.get("/environments", response_model=list[EnvironmentResponse])
async def list_environments(
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[EnvironmentResponse]:
    rows = await _query_lookup_list(db, Environment, q, limit)
    return [EnvironmentResponse.model_validate(r) for r in rows]
