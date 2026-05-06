from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.cigar import Cigar
from app.models.inventory import Inventory
from app.models.lookups import FlavorTag
from app.models.session import Pairing, SessionFlavorTag, SmokingSession, TastingNote
from app.models.user import User
from app.models.want_list import WantList
from app.schemas.sessions import SessionCreate, SessionUpdate

_DETAIL_OPTIONS = [
    joinedload(SmokingSession.cigar).joinedload(Cigar.brand),
    joinedload(SmokingSession.cigar).joinedload(Cigar.vitola),
    joinedload(SmokingSession.environment),
    joinedload(SmokingSession.tasting_note),
    selectinload(SmokingSession.flavor_tags).joinedload(SessionFlavorTag.tag),
    selectinload(SmokingSession.pairings),
]

_LIST_OPTIONS = [
    joinedload(SmokingSession.cigar).joinedload(Cigar.brand),
    joinedload(SmokingSession.cigar).joinedload(Cigar.vitola),
]


async def get_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> SmokingSession:
    result = await db.execute(
        select(SmokingSession)
        .where(SmokingSession.id == session_id, SmokingSession.user_id == user_id)
        .options(*_DETAIL_OPTIONS)
    )
    session = result.unique().scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


async def list_sessions(
    db: AsyncSession,
    user_id: UUID,
    *,
    skip: int = 0,
    limit: int = 50,
    cigar_id: Optional[UUID] = None,
    min_rating: Optional[int] = None,
    max_rating: Optional[int] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    would_buy_again: Optional[bool] = None,
) -> tuple[list[SmokingSession], int]:
    filters = [SmokingSession.user_id == user_id]
    if cigar_id is not None:
        filters.append(SmokingSession.cigar_id == cigar_id)
    if min_rating is not None:
        filters.append(SmokingSession.personal_rating >= min_rating)
    if max_rating is not None:
        filters.append(SmokingSession.personal_rating <= max_rating)
    if from_date is not None:
        filters.append(SmokingSession.smoked_at >= from_date)
    if to_date is not None:
        filters.append(SmokingSession.smoked_at <= to_date)
    if would_buy_again is not None:
        filters.append(SmokingSession.would_buy_again == would_buy_again)

    count_result = await db.execute(
        select(func.count()).select_from(SmokingSession).where(*filters)
    )
    total = count_result.scalar_one()

    items_result = await db.execute(
        select(SmokingSession)
        .where(*filters)
        .options(*_LIST_OPTIONS)
        .order_by(SmokingSession.smoked_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(items_result.unique().scalars().all()), total


async def create_session(db: AsyncSession, user_id: UUID, data: SessionCreate) -> SmokingSession:
    cigar_check = await db.execute(
        select(Cigar.id).where(Cigar.id == data.cigar_id, Cigar.user_id == user_id)
    )
    if cigar_check.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cigar not found")

    if data.inventory_id is not None:
        inv_result = await db.execute(
            select(Inventory).where(
                Inventory.id == data.inventory_id,
                Inventory.user_id == user_id,
                Inventory.cigar_id == data.cigar_id,
            )
        )
        inv = inv_result.scalar_one_or_none()
        if inv is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
        if inv.quantity < 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Inventory item has no remaining quantity",
            )
        inv.quantity -= 1

    shared = data.shared_to_community
    if shared is None:
        defaults_result = await db.execute(select(User.sharing_defaults).where(User.id == user_id))
        sharing_defaults = defaults_result.scalar_one_or_none()
        shared = bool((sharing_defaults or {}).get("shared_to_community", False))

    session = SmokingSession(
        user_id=user_id,
        cigar_id=data.cigar_id,
        inventory_id=data.inventory_id,
        smoked_at=data.smoked_at,
        duration_minutes=data.duration_minutes,
        location=data.location,
        environment_id=data.environment_id,
        occasion=data.occasion,
        personal_rating=data.personal_rating,
        would_buy_again=data.would_buy_again,
        add_to_want_list=data.add_to_want_list,
        shared_to_community=shared,
    )
    db.add(session)
    await db.flush()

    if data.tasting_notes is not None:
        db.add(TastingNote(session_id=session.id, **data.tasting_notes.model_dump()))

    if data.flavor_tags:
        for tag_data in data.flavor_tags:
            tag_check = await db.execute(
                select(FlavorTag.id).where(
                    FlavorTag.id == tag_data.tag_id,
                    FlavorTag.is_active == True,  # noqa: E712
                )
            )
            if tag_check.scalar_one_or_none() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Flavor tag {tag_data.tag_id} not found or inactive",
                )
            db.add(SessionFlavorTag(session_id=session.id, tag_id=tag_data.tag_id, third=tag_data.third))

    if data.pairings:
        for p_data in data.pairings:
            db.add(Pairing(session_id=session.id, **p_data.model_dump()))

    if data.add_to_want_list:
        existing = await db.execute(
            select(WantList.id).where(
                WantList.user_id == user_id,
                WantList.cigar_id == data.cigar_id,
                WantList.fulfilled == False,  # noqa: E712
            )
        )
        if existing.scalar_one_or_none() is None:
            db.add(WantList(
                user_id=user_id,
                cigar_id=data.cigar_id,
                session_id=session.id,
                fulfilled=False,
            ))

    await db.commit()
    return await get_session(db, session.id, user_id)


async def update_session(
    db: AsyncSession, user_id: UUID, session_id: UUID, data: SessionUpdate
) -> SmokingSession:
    session = await get_session(db, session_id, user_id)

    updates = data.model_dump(exclude_unset=True, exclude={"tasting_notes"})
    for field, value in updates.items():
        setattr(session, field, value)

    if "tasting_notes" in data.model_fields_set:
        if session.tasting_note is not None:
            await db.delete(session.tasting_note)
            await db.flush()
        if data.tasting_notes is not None:
            db.add(TastingNote(session_id=session.id, **data.tasting_notes.model_dump()))

    await db.commit()
    return await get_session(db, session_id, user_id)


async def delete_session(db: AsyncSession, user_id: UUID, session_id: UUID) -> None:
    result = await db.execute(
        select(SmokingSession.inventory_id).where(
            SmokingSession.id == session_id,
            SmokingSession.user_id == user_id,
        )
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    inventory_id = row[0]
    if inventory_id is not None:
        inv_result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
        inv = inv_result.scalar_one_or_none()
        if inv is not None:
            inv.quantity += 1

    await db.execute(
        delete(WantList).where(
            WantList.session_id == session_id,
            WantList.fulfilled == False,  # noqa: E712
        )
    )
    await db.execute(delete(SessionFlavorTag).where(SessionFlavorTag.session_id == session_id))
    await db.execute(delete(Pairing).where(Pairing.session_id == session_id))
    await db.execute(delete(TastingNote).where(TastingNote.session_id == session_id))
    await db.execute(delete(SmokingSession).where(SmokingSession.id == session_id))
    await db.commit()
