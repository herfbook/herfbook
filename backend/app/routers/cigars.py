from __future__ import annotations

import asyncio
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import delete as sa_delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar, CigarFiller, CigarImage
from app.models.inventory import Inventory
from app.models.lookups import (
    Binder,
    Brand,
    Country,
    Filler,
    Manufacturer,
    StrengthLevel,
    Vitola,
    Wrapper,
)
from app.models.session import SmokingSession
from app.models.user import User
from app.schemas.cigars import (
    CigarCreate,
    CigarDetail,
    CigarImageResponse,
    CigarImageUpdate,
    CigarListItem,
    CigarUpdate,
    FillerResponse,
    PaginatedCigars,
)
from app.services.minio_service import MinIOService, get_minio_service

router = APIRouter()

_VALID_IMAGE_TYPES: set[str] = {"band", "full", "ash"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _vitola_size(cigar: Cigar) -> str | None:
    length = (
        cigar.custom_length
        if cigar.custom_length is not None
        else (cigar.vitola.length_inches if cigar.vitola else None)
    )
    rg = (
        cigar.custom_ring_gauge
        if cigar.custom_ring_gauge is not None
        else (cigar.vitola.ring_gauge if cigar.vitola else None)
    )
    if length is not None and rg is not None:
        return f"{float(length)} × {int(rg)}"
    return None


async def _validate_lookup(
    db: AsyncSession,
    model: type,
    lookup_id: UUID,
    label: str,
) -> None:
    result = await db.execute(
        select(model).where(
            model.id == lookup_id,
            model.is_imported == True,  # noqa: E712
            model.is_active == True,  # noqa: E712
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{label} not found or not active",
        )


async def _get_cigar_or_404(db: AsyncSession, cigar_id: UUID, user_id: UUID) -> Cigar:
    result = await db.execute(
        select(Cigar).where(Cigar.id == cigar_id, Cigar.user_id == user_id)
    )
    cigar = result.scalar_one_or_none()
    if cigar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")
    return cigar


async def _load_full_cigar(db: AsyncSession, cigar_id: UUID, user_id: UUID) -> Cigar:
    """Load a cigar with all relationships eagerly."""
    result = await db.execute(
        select(Cigar)
        .where(Cigar.id == cigar_id, Cigar.user_id == user_id)
        .options(
            selectinload(Cigar.brand),
            selectinload(Cigar.vitola),
            selectinload(Cigar.wrapper),
            selectinload(Cigar.binder),
            selectinload(Cigar.country),
            selectinload(Cigar.manufacturer),
            selectinload(Cigar.strength),
            selectinload(Cigar.fillers),
            selectinload(Cigar.images),
        )
    )
    cigar = result.unique().scalar_one_or_none()
    if cigar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")
    return cigar


def _build_image_response(img: CigarImage, minio_svc: MinIOService) -> CigarImageResponse:
    return CigarImageResponse(
        id=img.id,
        image_url=minio_svc.get_presigned_url(img.image_url),
        image_type=img.image_type,
        is_primary=img.is_primary,
        sort_order=img.sort_order,
        created_at=img.created_at,
    )


def _build_detail(cigar: Cigar, minio_svc: MinIOService) -> CigarDetail:
    images_sorted = sorted(cigar.images, key=lambda img: img.sort_order)
    primary_img = next((img for img in images_sorted if img.is_primary), None)
    primary_url = minio_svc.get_presigned_url(primary_img.image_url) if primary_img else None

    return CigarDetail(
        id=cigar.id,
        brand_id=cigar.brand_id,
        brand_name=cigar.brand.name,
        line=cigar.line,
        vitola_id=cigar.vitola_id,
        vitola_name=cigar.vitola.name if cigar.vitola else None,
        vitola_size=_vitola_size(cigar),
        wrapper_id=cigar.wrapper_id,
        wrapper_name=cigar.wrapper.name if cigar.wrapper else None,
        strength_id=cigar.strength_id,
        strength_name=cigar.strength.name if cigar.strength else None,
        country_id=cigar.country_id,
        country_name=cigar.country.name if cigar.country else None,
        primary_image_url=primary_url,
        created_at=cigar.created_at,
        custom_vitola_name=cigar.custom_vitola_name,
        custom_length=float(cigar.custom_length) if cigar.custom_length is not None else None,
        custom_ring_gauge=cigar.custom_ring_gauge,
        binder_id=cigar.binder_id,
        binder_name=cigar.binder.name if cigar.binder else None,
        manufacturer_id=cigar.manufacturer_id,
        manufacturer_name=cigar.manufacturer.name if cigar.manufacturer else None,
        fillers=[
            FillerResponse(id=f.id, name=f.name, country=f.country, priming=f.priming)
            for f in cigar.fillers
        ],
        upc=cigar.upc,
        description=cigar.description,
        is_user_created=cigar.is_user_created,
        submission_status=cigar.submission_status,
        images=[_build_image_response(img, minio_svc) for img in images_sorted],
        updated_at=cigar.updated_at,
    )


async def _validate_create_lookups(db: AsyncSession, body: CigarCreate) -> None:
    await _validate_lookup(db, Brand, body.brand_id, "Brand")
    if body.vitola_id is not None:
        await _validate_lookup(db, Vitola, body.vitola_id, "Vitola")
    if body.wrapper_id is not None:
        await _validate_lookup(db, Wrapper, body.wrapper_id, "Wrapper")
    if body.binder_id is not None:
        await _validate_lookup(db, Binder, body.binder_id, "Binder")
    if body.country_id is not None:
        await _validate_lookup(db, Country, body.country_id, "Country")
    if body.manufacturer_id is not None:
        await _validate_lookup(db, Manufacturer, body.manufacturer_id, "Manufacturer")
    if body.strength_id is not None:
        await _validate_lookup(db, StrengthLevel, body.strength_id, "Strength")
    for fid in body.filler_ids:
        await _validate_lookup(db, Filler, fid, "Filler")


# ---------------------------------------------------------------------------
# Cigar CRUD
# ---------------------------------------------------------------------------


@router.post("", response_model=CigarDetail, status_code=status.HTTP_201_CREATED)
async def create_cigar(
    body: CigarCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CigarDetail:
    """Create a new cigar with lookup FK validation and filler associations."""
    await _validate_create_lookups(db, body)

    cigar = Cigar(
        user_id=current_user.id,
        brand_id=body.brand_id,
        line=body.line,
        vitola_id=body.vitola_id,
        custom_vitola_name=body.custom_vitola_name,
        custom_length=body.custom_length,
        custom_ring_gauge=body.custom_ring_gauge,
        wrapper_id=body.wrapper_id,
        binder_id=body.binder_id,
        country_id=body.country_id,
        manufacturer_id=body.manufacturer_id,
        strength_id=body.strength_id,
        upc=body.upc,
        description=body.description,
        is_user_created=True,
    )
    db.add(cigar)
    await db.flush()

    for filler_id in body.filler_ids:
        db.add(CigarFiller(cigar_id=cigar.id, filler_id=filler_id))

    await db.commit()
    cigar = await _load_full_cigar(db, cigar.id, current_user.id)
    return _build_detail(cigar, get_minio_service())


@router.get("", response_model=PaginatedCigars)
async def list_cigars(
    q: Optional[str] = Query(default=None),
    brand_id: Optional[UUID] = Query(default=None),
    wrapper_id: Optional[UUID] = Query(default=None),
    strength_id: Optional[UUID] = Query(default=None),
    country_id: Optional[UUID] = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedCigars:
    """List and search cigars with optional text search and filters."""
    base_filters = [Cigar.user_id == current_user.id]
    if brand_id is not None:
        base_filters.append(Cigar.brand_id == brand_id)
    if wrapper_id is not None:
        base_filters.append(Cigar.wrapper_id == wrapper_id)
    if strength_id is not None:
        base_filters.append(Cigar.strength_id == strength_id)
    if country_id is not None:
        base_filters.append(Cigar.country_id == country_id)

    need_brand_join = q is not None

    # Count
    count_stmt = select(func.count(Cigar.id)).where(*base_filters)
    if need_brand_join:
        count_stmt = count_stmt.join(Brand, Cigar.brand_id == Brand.id).where(
            or_(Brand.name.ilike(f"%{q}%"), Cigar.line.ilike(f"%{q}%"))
        )
    total = (await db.execute(count_stmt)).scalar_one()

    # Main query
    main_stmt = (
        select(Cigar)
        .where(*base_filters)
        .options(
            selectinload(Cigar.brand),
            selectinload(Cigar.vitola),
            selectinload(Cigar.wrapper),
            selectinload(Cigar.strength),
            selectinload(Cigar.country),
            selectinload(Cigar.images),
        )
        .order_by(Cigar.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if need_brand_join:
        main_stmt = main_stmt.join(Brand, Cigar.brand_id == Brand.id).where(
            or_(Brand.name.ilike(f"%{q}%"), Cigar.line.ilike(f"%{q}%"))
        )

    cigars = (await db.execute(main_stmt)).unique().scalars().all()

    minio_svc = get_minio_service()
    items = []
    for cigar in cigars:
        primary_img = next((img for img in cigar.images if img.is_primary), None)
        primary_url = minio_svc.get_presigned_url(primary_img.image_url) if primary_img else None
        items.append(
            CigarListItem(
                id=cigar.id,
                brand_id=cigar.brand_id,
                brand_name=cigar.brand.name,
                line=cigar.line,
                vitola_id=cigar.vitola_id,
                vitola_name=cigar.vitola.name if cigar.vitola else None,
                vitola_size=_vitola_size(cigar),
                wrapper_id=cigar.wrapper_id,
                wrapper_name=cigar.wrapper.name if cigar.wrapper else None,
                strength_id=cigar.strength_id,
                strength_name=cigar.strength.name if cigar.strength else None,
                country_id=cigar.country_id,
                country_name=cigar.country.name if cigar.country else None,
                primary_image_url=primary_url,
                created_at=cigar.created_at,
            )
        )

    return PaginatedCigars(items=items, total=total, offset=offset, limit=limit)


@router.get("/{cigar_id}", response_model=CigarDetail)
async def get_cigar(
    cigar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CigarDetail:
    """Get full cigar detail with all resolved lookup names and presigned image URLs."""
    cigar = await _load_full_cigar(db, cigar_id, current_user.id)
    return _build_detail(cigar, get_minio_service())


@router.patch("/{cigar_id}", response_model=CigarDetail)
async def update_cigar(
    cigar_id: UUID,
    body: CigarUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CigarDetail:
    """Update cigar fields. Providing filler_ids replaces the full filler set."""
    cigar = await _get_cigar_or_404(db, cigar_id, current_user.id)

    updates = body.model_dump(exclude_unset=True)
    filler_ids: list[UUID] | None = updates.pop("filler_ids", None)

    # Validate any FK IDs being changed
    if "brand_id" in updates:
        await _validate_lookup(db, Brand, updates["brand_id"], "Brand")
    if "vitola_id" in updates and updates["vitola_id"] is not None:
        await _validate_lookup(db, Vitola, updates["vitola_id"], "Vitola")
    if "wrapper_id" in updates and updates["wrapper_id"] is not None:
        await _validate_lookup(db, Wrapper, updates["wrapper_id"], "Wrapper")
    if "binder_id" in updates and updates["binder_id"] is not None:
        await _validate_lookup(db, Binder, updates["binder_id"], "Binder")
    if "country_id" in updates and updates["country_id"] is not None:
        await _validate_lookup(db, Country, updates["country_id"], "Country")
    if "manufacturer_id" in updates and updates["manufacturer_id"] is not None:
        await _validate_lookup(db, Manufacturer, updates["manufacturer_id"], "Manufacturer")
    if "strength_id" in updates and updates["strength_id"] is not None:
        await _validate_lookup(db, StrengthLevel, updates["strength_id"], "Strength")

    for field, value in updates.items():
        setattr(cigar, field, value)

    if filler_ids is not None:
        for fid in filler_ids:
            await _validate_lookup(db, Filler, fid, "Filler")
        await db.execute(sa_delete(CigarFiller).where(CigarFiller.cigar_id == cigar.id))
        for fid in filler_ids:
            db.add(CigarFiller(cigar_id=cigar.id, filler_id=fid))

    await db.commit()
    cigar = await _load_full_cigar(db, cigar_id, current_user.id)
    return _build_detail(cigar, get_minio_service())


@router.delete("/{cigar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cigar(
    cigar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Hard delete a cigar if it has no inventory or smoking session references."""
    cigar = await _get_cigar_or_404(db, cigar_id, current_user.id)

    inv_count = (
        await db.execute(
            select(func.count(Inventory.id)).where(Inventory.cigar_id == cigar.id)
        )
    ).scalar_one()
    if inv_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cigar cannot be deleted while it has inventory records. Remove inventory first.",
        )

    session_count = (
        await db.execute(
            select(func.count(SmokingSession.id)).where(SmokingSession.cigar_id == cigar.id)
        )
    ).scalar_one()
    if session_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cigar cannot be deleted while it has smoking session records.",
        )

    # Delete images from MinIO then from DB
    images_result = await db.execute(
        select(CigarImage).where(CigarImage.cigar_id == cigar.id)
    )
    images = images_result.scalars().all()
    minio_svc = get_minio_service()
    for img in images:
        await asyncio.to_thread(minio_svc.delete_image, img.image_url)

    await db.execute(sa_delete(CigarImage).where(CigarImage.cigar_id == cigar.id))
    await db.execute(sa_delete(CigarFiller).where(CigarFiller.cigar_id == cigar.id))
    await db.delete(cigar)
    await db.commit()


# ---------------------------------------------------------------------------
# Image management
# ---------------------------------------------------------------------------


@router.post(
    "/{cigar_id}/images",
    response_model=CigarImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    cigar_id: UUID,
    file: UploadFile,
    image_type: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CigarImageResponse:
    """Upload an image for a cigar (max 3 per cigar, 5 MB, JPEG/PNG/WebP)."""
    if image_type not in _VALID_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"image_type must be one of: {', '.join(sorted(_VALID_IMAGE_TYPES))}",
        )

    cigar = await _get_cigar_or_404(db, cigar_id, current_user.id)

    img_count = (
        await db.execute(
            select(func.count(CigarImage.id)).where(CigarImage.cigar_id == cigar.id)
        )
    ).scalar_one()
    if img_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 3 images per cigar",
        )

    data = await file.read()
    content_type = file.content_type or ""
    original_filename = file.filename or "image"

    minio_svc = get_minio_service()
    try:
        s3_key = await asyncio.to_thread(
            minio_svc.upload_image,
            data,
            content_type,
            current_user.id,
            cigar.id,
            original_filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    is_first = img_count == 0
    max_sort = (
        await db.execute(
            select(func.coalesce(func.max(CigarImage.sort_order), -1)).where(
                CigarImage.cigar_id == cigar.id
            )
        )
    ).scalar_one()

    img = CigarImage(
        cigar_id=cigar.id,
        user_id=current_user.id,
        image_url=s3_key,
        image_type=image_type,
        is_primary=is_first,
        sort_order=int(max_sort) + 1,
    )
    db.add(img)
    await db.commit()
    await db.refresh(img)

    return CigarImageResponse(
        id=img.id,
        image_url=minio_svc.get_presigned_url(img.image_url),
        image_type=img.image_type,
        is_primary=img.is_primary,
        sort_order=img.sort_order,
        created_at=img.created_at,
    )


@router.delete(
    "/{cigar_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_image(
    cigar_id: UUID,
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a cigar image from MinIO and DB. Auto-promotes next image to primary if needed."""
    await _get_cigar_or_404(db, cigar_id, current_user.id)

    img_result = await db.execute(
        select(CigarImage).where(
            CigarImage.id == image_id,
            CigarImage.cigar_id == cigar_id,
        )
    )
    img = img_result.scalar_one_or_none()
    if img is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    was_primary = img.is_primary
    minio_svc = get_minio_service()
    await asyncio.to_thread(minio_svc.delete_image, img.image_url)
    await db.delete(img)
    await db.flush()

    if was_primary:
        next_img_result = await db.execute(
            select(CigarImage)
            .where(CigarImage.cigar_id == cigar_id)
            .order_by(CigarImage.sort_order.asc())
            .limit(1)
        )
        next_img = next_img_result.scalar_one_or_none()
        if next_img is not None:
            next_img.is_primary = True

    await db.commit()


@router.patch("/{cigar_id}/images/{image_id}", response_model=CigarImageResponse)
async def update_image(
    cigar_id: UUID,
    image_id: UUID,
    body: CigarImageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CigarImageResponse:
    """Set an image as primary (clears primary flag on all other images for this cigar)."""
    await _get_cigar_or_404(db, cigar_id, current_user.id)

    img_result = await db.execute(
        select(CigarImage).where(
            CigarImage.id == image_id,
            CigarImage.cigar_id == cigar_id,
        )
    )
    img = img_result.scalar_one_or_none()
    if img is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    if body.is_primary:
        # Clear primary on siblings
        siblings_result = await db.execute(
            select(CigarImage).where(
                CigarImage.cigar_id == cigar_id,
                CigarImage.id != image_id,
                CigarImage.is_primary == True,  # noqa: E712
            )
        )
        for sibling in siblings_result.scalars().all():
            sibling.is_primary = False

    img.is_primary = body.is_primary
    await db.commit()
    await db.refresh(img)

    minio_svc = get_minio_service()
    return CigarImageResponse(
        id=img.id,
        image_url=minio_svc.get_presigned_url(img.image_url),
        image_type=img.image_type,
        is_primary=img.is_primary,
        sort_order=img.sort_order,
        created_at=img.created_at,
    )
