from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.lookups import FlavorTag
from app.models.session import Pairing, SessionFlavorTag, SmokingSession
from app.models.user import User
from app.schemas.sessions import (
    PaginatedSessions,
    PairingCreate,
    PairingResponse,
    PairingUpdate,
    SessionCreate,
    SessionFlavorTagCreate,
    SessionFlavorTagResponse,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
    TastingNoteResponse,
)
from app.services import session_service

router = APIRouter()


def _build_tasting_note_response(tn) -> TastingNoteResponse:
    return TastingNoteResponse(
        id=tn.id,
        session_id=tn.session_id,
        draw_quality=tn.draw_quality,
        burn_quality=tn.burn_quality,
        ash_color=tn.ash_color,
        ash_hold=tn.ash_hold,
        strength_first_id=tn.strength_first_id,
        strength_second_id=tn.strength_second_id,
        strength_third_id=tn.strength_third_id,
        flavor_first=tn.flavor_first,
        flavor_second=tn.flavor_second,
        flavor_third=tn.flavor_third,
        overall_notes=tn.overall_notes,
        retrohale_notes=tn.retrohale_notes,
        finish=tn.finish,
    )


def _build_flavor_tag_response(sft) -> SessionFlavorTagResponse:
    return SessionFlavorTagResponse(
        id=sft.id,
        tag_id=sft.tag_id,
        tag_name=sft.tag.name,
        tag_category=sft.tag.category,
        third=sft.third,
    )


def _build_pairing_response(p) -> PairingResponse:
    return PairingResponse(
        id=p.id,
        session_id=p.session_id,
        type=p.type,
        name=p.name,
        notes=p.notes,
        rating=p.rating,
    )


def _cigar_vitola(cigar) -> Optional[str]:
    if cigar is None:
        return None
    if cigar.vitola:
        return cigar.vitola.name
    return cigar.custom_vitola_name


def _build_session_response(s: SmokingSession) -> SessionResponse:
    return SessionResponse(
        id=s.id,
        cigar_id=s.cigar_id,
        inventory_id=s.inventory_id,
        smoked_at=s.smoked_at,
        duration_minutes=s.duration_minutes,
        location=s.location,
        environment_id=s.environment_id,
        environment_name=s.environment.name if s.environment else None,
        occasion=s.occasion,
        personal_rating=s.personal_rating,
        would_buy_again=s.would_buy_again,
        add_to_want_list=s.add_to_want_list,
        shared_to_community=s.shared_to_community,
        created_at=s.created_at,
        updated_at=s.updated_at,
        tasting_notes=_build_tasting_note_response(s.tasting_note) if s.tasting_note else None,
        flavor_tags=[_build_flavor_tag_response(sft) for sft in s.flavor_tags],
        pairings=[_build_pairing_response(p) for p in s.pairings],
        cigar_brand=s.cigar.brand.name if s.cigar and s.cigar.brand else None,
        cigar_line=s.cigar.line if s.cigar else None,
        cigar_vitola=_cigar_vitola(s.cigar),
    )


def _build_session_list_item(s: SmokingSession) -> SessionListResponse:
    return SessionListResponse(
        id=s.id,
        cigar_id=s.cigar_id,
        smoked_at=s.smoked_at,
        location=s.location,
        personal_rating=s.personal_rating,
        would_buy_again=s.would_buy_again,
        cigar_brand=s.cigar.brand.name if s.cigar and s.cigar.brand else None,
        cigar_line=s.cigar.line if s.cigar else None,
        cigar_vitola=_cigar_vitola(s.cigar),
        created_at=s.created_at,
    )


async def _verify_session_owner(db: AsyncSession, session_id: UUID, user_id: UUID) -> None:
    result = await db.execute(
        select(SmokingSession.id).where(
            SmokingSession.id == session_id,
            SmokingSession.user_id == user_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")


# --- Session CRUD ---

@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await session_service.create_session(db, current_user.id, body)
    return _build_session_response(session)


@router.get("", response_model=PaginatedSessions)
async def list_sessions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    cigar_id: Optional[UUID] = Query(default=None),
    min_rating: Optional[int] = Query(default=None, ge=0, le=100),
    max_rating: Optional[int] = Query(default=None, ge=0, le=100),
    from_date: Optional[datetime] = Query(default=None),
    to_date: Optional[datetime] = Query(default=None),
    would_buy_again: Optional[bool] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedSessions:
    items, total = await session_service.list_sessions(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        cigar_id=cigar_id,
        min_rating=min_rating,
        max_rating=max_rating,
        from_date=from_date,
        to_date=to_date,
        would_buy_again=would_buy_again,
    )
    return PaginatedSessions(
        items=[_build_session_list_item(s) for s in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await session_service.get_session(db, session_id, current_user.id)
    return _build_session_response(session)


@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: UUID,
    body: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    session = await session_service.update_session(db, current_user.id, session_id, body)
    return _build_session_response(session)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await session_service.delete_session(db, current_user.id, session_id)


# --- Flavor tag sub-resource ---

@router.post(
    "/{session_id}/tags",
    response_model=SessionFlavorTagResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_flavor_tag(
    session_id: UUID,
    body: SessionFlavorTagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionFlavorTagResponse:
    await _verify_session_owner(db, session_id, current_user.id)

    tag_check = await db.execute(
        select(FlavorTag).where(
            FlavorTag.id == body.tag_id,
            FlavorTag.is_active == True,  # noqa: E712
        )
    )
    tag = tag_check.scalar_one_or_none()
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flavor tag not found or inactive")

    existing = await db.execute(
        select(SessionFlavorTag.id).where(
            SessionFlavorTag.session_id == session_id,
            SessionFlavorTag.tag_id == body.tag_id,
            SessionFlavorTag.third == body.third,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Flavor tag already added for this session and third",
        )

    sft = SessionFlavorTag(session_id=session_id, tag_id=body.tag_id, third=body.third)
    db.add(sft)
    await db.commit()
    await db.refresh(sft)

    return SessionFlavorTagResponse(
        id=sft.id,
        tag_id=sft.tag_id,
        tag_name=tag.name,
        tag_category=tag.category,
        third=sft.third,
    )


@router.delete("/{session_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_flavor_tag(
    session_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """tag_id is SessionFlavorTag.id (not FlavorTag.id)."""
    await _verify_session_owner(db, session_id, current_user.id)

    result = await db.execute(
        select(SessionFlavorTag).where(
            SessionFlavorTag.id == tag_id,
            SessionFlavorTag.session_id == session_id,
        )
    )
    sft = result.scalar_one_or_none()
    if sft is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flavor tag not found")

    await db.delete(sft)
    await db.commit()


# --- Pairing sub-resource ---

@router.post(
    "/{session_id}/pairings",
    response_model=PairingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_pairing(
    session_id: UUID,
    body: PairingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PairingResponse:
    await _verify_session_owner(db, session_id, current_user.id)

    pairing = Pairing(session_id=session_id, **body.model_dump())
    db.add(pairing)
    await db.commit()
    await db.refresh(pairing)
    return _build_pairing_response(pairing)


@router.patch("/{session_id}/pairings/{pairing_id}", response_model=PairingResponse)
async def update_pairing(
    session_id: UUID,
    pairing_id: UUID,
    body: PairingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PairingResponse:
    await _verify_session_owner(db, session_id, current_user.id)

    result = await db.execute(
        select(Pairing).where(Pairing.id == pairing_id, Pairing.session_id == session_id)
    )
    pairing = result.scalar_one_or_none()
    if pairing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pairing not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(pairing, field, value)

    await db.commit()
    await db.refresh(pairing)
    return _build_pairing_response(pairing)


@router.delete("/{session_id}/pairings/{pairing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_pairing(
    session_id: UUID,
    pairing_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _verify_session_owner(db, session_id, current_user.id)

    result = await db.execute(
        select(Pairing).where(Pairing.id == pairing_id, Pairing.session_id == session_id)
    )
    pairing = result.scalar_one_or_none()
    if pairing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pairing not found")

    await db.delete(pairing)
    await db.commit()
