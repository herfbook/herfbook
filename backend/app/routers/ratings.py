"""
External ratings endpoints — personal reference data.

Per DESIGN.md §7.2, external ratings are personal bookmarks of industry
reviews. Scores and links are stored locally; the M2 community DB will
store links only, never scores. External ratings are never synced to
the community layer.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cigar import Cigar
from app.models.rating import CigarExternalRating
from app.models.user import User
from app.schemas.ratings import (
    ExternalRatingCreate,
    ExternalRatingResponse,
    ExternalRatingUpdate,
)

router = APIRouter()


async def _get_cigar(db: AsyncSession, cigar_id: UUID, user_id: UUID) -> Cigar:
    result = await db.execute(
        select(Cigar).where(Cigar.id == cigar_id, Cigar.user_id == user_id)
    )
    cigar = result.scalar_one_or_none()
    if cigar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")
    return cigar


async def _get_rating(
    db: AsyncSession, rating_id: UUID, cigar_id: UUID, user_id: UUID
) -> CigarExternalRating:
    result = await db.execute(
        select(CigarExternalRating).where(
            CigarExternalRating.id == rating_id,
            CigarExternalRating.cigar_id == cigar_id,
            CigarExternalRating.user_id == user_id,
        )
    )
    rating = result.scalar_one_or_none()
    if rating is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    return rating


@router.post(
    "/{cigar_id}/ratings",
    response_model=ExternalRatingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_external_rating(
    cigar_id: UUID,
    body: ExternalRatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExternalRatingResponse:
    await _get_cigar(db, cigar_id, current_user.id)

    rating = CigarExternalRating(
        cigar_id=cigar_id,
        user_id=current_user.id,
        **body.model_dump(),
    )
    db.add(rating)
    await db.commit()
    await db.refresh(rating)
    return ExternalRatingResponse.model_validate(rating)


@router.get("/{cigar_id}/ratings", response_model=list[ExternalRatingResponse])
async def list_external_ratings(
    cigar_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ExternalRatingResponse]:
    await _get_cigar(db, cigar_id, current_user.id)

    result = await db.execute(
        select(CigarExternalRating)
        .where(
            CigarExternalRating.cigar_id == cigar_id,
            CigarExternalRating.user_id == current_user.id,
        )
        .order_by(CigarExternalRating.created_at.desc())
    )
    ratings = result.scalars().all()
    return [ExternalRatingResponse.model_validate(r) for r in ratings]


@router.patch("/{cigar_id}/ratings/{rating_id}", response_model=ExternalRatingResponse)
async def update_external_rating(
    cigar_id: UUID,
    rating_id: UUID,
    body: ExternalRatingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExternalRatingResponse:
    await _get_cigar(db, cigar_id, current_user.id)
    rating = await _get_rating(db, rating_id, cigar_id, current_user.id)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rating, field, value)

    await db.commit()
    await db.refresh(rating)
    return ExternalRatingResponse.model_validate(rating)


@router.delete("/{cigar_id}/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_external_rating(
    cigar_id: UUID,
    rating_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_cigar(db, cigar_id, current_user.id)
    rating = await _get_rating(db, rating_id, cigar_id, current_user.id)
    await db.delete(rating)
    await db.commit()
