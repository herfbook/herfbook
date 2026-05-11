from __future__ import annotations

import secrets
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.auth.dependencies import check_guest_permission, get_current_user, get_guest_link
from app.database import get_db
from app.models.cigar import Cigar
from app.models.guest import GuestLink, SwapListItem
from app.models.humidor import Humidor
from app.models.inventory import Inventory
from app.models.session import SessionFlavorTag, SmokingSession
from app.models.user import User
from app.models.want_list import WantList
from app.schemas.guests import (
    GuestCigarResponse,
    GuestHumidorResponse,
    GuestLinkCreate,
    GuestLinkResponse,
    GuestLinkUpdate,
    GuestSessionResponse,
    GuestSwapListResponse,
    GuestWantListResponse,
)
from app.schemas.sessions import PairingResponse, SessionFlavorTagResponse, TastingNoteResponse

router = APIRouter()


def _share_url(token: str) -> str:
    return f"/g/{token}"


def _cigar_vitola(cigar) -> Optional[str]:
    if cigar is None:
        return None
    if cigar.vitola:
        return cigar.vitola.name
    return cigar.custom_vitola_name


def _build_guest_link_response(link: GuestLink) -> GuestLinkResponse:
    return GuestLinkResponse(
        id=link.id,
        token=link.token,
        label=link.label,
        permissions=link.permissions,
        expires_at=link.expires_at,
        is_active=link.is_active,
        last_accessed=link.last_accessed,
        created_at=link.created_at,
        share_url=_share_url(link.token),
    )


# --- Owner Management (JWT auth) ---

@router.post("/guests", response_model=GuestLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_guest_link(
    body: GuestLinkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GuestLinkResponse:
    token = secrets.token_urlsafe(48)
    link = GuestLink(
        user_id=current_user.id,
        token=token,
        label=body.label,
        permissions=body.permissions,
        expires_at=body.expires_at,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return _build_guest_link_response(link)


@router.get("/guests", response_model=list[GuestLinkResponse])
async def list_guest_links(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[GuestLinkResponse]:
    result = await db.execute(
        select(GuestLink)
        .where(GuestLink.user_id == current_user.id)
        .order_by(GuestLink.created_at.desc())
    )
    links = result.scalars().all()
    return [_build_guest_link_response(link) for link in links]


@router.patch("/guests/{link_id}", response_model=GuestLinkResponse)
async def update_guest_link(
    link_id: UUID,
    body: GuestLinkUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GuestLinkResponse:
    result = await db.execute(
        select(GuestLink).where(
            GuestLink.id == link_id,
            GuestLink.user_id == current_user.id,
        )
    )
    link = result.scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest link not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(link, field, value)

    await db.commit()
    await db.refresh(link)
    return _build_guest_link_response(link)


@router.delete("/guests/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_guest_link(
    link_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(GuestLink).where(
            GuestLink.id == link_id,
            GuestLink.user_id == current_user.id,
        )
    )
    link = result.scalar_one_or_none()
    if link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest link not found")
    link.is_active = False
    await db.commit()


# --- Public Guest Views (token auth, no JWT) ---

@router.get("/g/{token}/collection", response_model=list[GuestCigarResponse])
async def guest_collection(
    token: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[GuestCigarResponse]:
    link = await get_guest_link(token, db)
    check_guest_permission(link, "collection")

    result = await db.execute(
        select(Inventory)
        .where(Inventory.user_id == link.user_id, Inventory.quantity > 0)
        .options(
            joinedload(Inventory.cigar).joinedload(Cigar.brand),
            joinedload(Inventory.cigar).joinedload(Cigar.vitola),
            joinedload(Inventory.cigar).joinedload(Cigar.wrapper),
            joinedload(Inventory.cigar).joinedload(Cigar.country),
            joinedload(Inventory.cigar).joinedload(Cigar.strength),
            joinedload(Inventory.humidor),
        )
        .offset(skip)
        .limit(limit)
    )
    items = result.unique().scalars().all()

    return [
        GuestCigarResponse(
            id=inv.cigar.id,
            brand_name=inv.cigar.brand.name if inv.cigar.brand else None,
            line_name=inv.cigar.line.name if inv.cigar.line else None,
            vitola_name=_cigar_vitola(inv.cigar),
            wrapper_name=inv.cigar.wrapper.name if inv.cigar.wrapper else None,
            country_name=inv.cigar.country.name if inv.cigar.country else None,
            strength_name=inv.cigar.strength.name if inv.cigar.strength else None,
            humidor_name=inv.humidor.name if inv.humidor else None,
            quantity=inv.quantity,
        )
        for inv in items
    ]


@router.get("/g/{token}/journal", response_model=list[GuestSessionResponse])
async def guest_journal(
    token: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[GuestSessionResponse]:
    link = await get_guest_link(token, db)
    check_guest_permission(link, "journal")

    result = await db.execute(
        select(SmokingSession)
        .where(SmokingSession.user_id == link.user_id)
        .options(
            joinedload(SmokingSession.cigar).joinedload(Cigar.brand),
            joinedload(SmokingSession.cigar).joinedload(Cigar.vitola),
            joinedload(SmokingSession.environment),
            joinedload(SmokingSession.tasting_note),
            selectinload(SmokingSession.flavor_tags).joinedload(SessionFlavorTag.tag),
            selectinload(SmokingSession.pairings),
        )
        .order_by(SmokingSession.smoked_at.desc())
        .offset(skip)
        .limit(limit)
    )
    sessions = result.unique().scalars().all()

    def _build(s: SmokingSession) -> GuestSessionResponse:
        tn = None
        if s.tasting_note:
            tn = TastingNoteResponse(
                id=s.tasting_note.id,
                session_id=s.tasting_note.session_id,
                draw_quality=s.tasting_note.draw_quality,
                burn_quality=s.tasting_note.burn_quality,
                ash_color=s.tasting_note.ash_color,
                ash_hold=s.tasting_note.ash_hold,
                strength_first_id=s.tasting_note.strength_first_id,
                strength_second_id=s.tasting_note.strength_second_id,
                strength_third_id=s.tasting_note.strength_third_id,
                flavor_first=s.tasting_note.flavor_first,
                flavor_second=s.tasting_note.flavor_second,
                flavor_third=s.tasting_note.flavor_third,
                overall_notes=s.tasting_note.overall_notes,
                retrohale_notes=s.tasting_note.retrohale_notes,
                finish=s.tasting_note.finish,
            )
        return GuestSessionResponse(
            id=s.id,
            cigar_brand=s.cigar.brand.name if s.cigar and s.cigar.brand else None,
            cigar_line=s.cigar.line.name if s.cigar and s.cigar.line else None,
            cigar_vitola=_cigar_vitola(s.cigar),
            smoked_at=s.smoked_at,
            duration_minutes=s.duration_minutes,
            location=s.location,
            environment_name=s.environment.name if s.environment else None,
            personal_rating=s.personal_rating,
            would_buy_again=s.would_buy_again,
            tasting_notes=tn,
            flavor_tags=[
                SessionFlavorTagResponse(
                    id=sft.id,
                    tag_id=sft.tag_id,
                    tag_name=sft.tag.name,
                    tag_category=sft.tag.category,
                    third=sft.third,
                )
                for sft in s.flavor_tags
            ],
            pairings=[
                PairingResponse(
                    id=p.id,
                    session_id=p.session_id,
                    type=p.type,
                    name=p.name,
                    notes=p.notes,
                    rating=p.rating,
                )
                for p in s.pairings
            ],
        )

    return [_build(s) for s in sessions]


@router.get("/g/{token}/humidors", response_model=list[GuestHumidorResponse])
async def guest_humidors(
    token: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[GuestHumidorResponse]:
    link = await get_guest_link(token, db)
    check_guest_permission(link, "humidors")

    result = await db.execute(
        select(Humidor)
        .where(
            Humidor.user_id == link.user_id,
            Humidor.is_active == True,  # noqa: E712
        )
        .options(
            selectinload(Humidor.inventory_items).options(
                joinedload(Inventory.cigar).joinedload(Cigar.brand),
                joinedload(Inventory.cigar).joinedload(Cigar.vitola),
                joinedload(Inventory.cigar).joinedload(Cigar.wrapper),
                joinedload(Inventory.cigar).joinedload(Cigar.country),
                joinedload(Inventory.cigar).joinedload(Cigar.strength),
            )
        )
        .offset(skip)
        .limit(limit)
    )
    humidors = result.unique().scalars().all()

    def _build_humidor(h: Humidor) -> GuestHumidorResponse:
        cigars = [
            GuestCigarResponse(
                id=inv.cigar.id,
                brand_name=inv.cigar.brand.name if inv.cigar.brand else None,
                line_name=inv.cigar.line.name if inv.cigar.line else None,
                vitola_name=_cigar_vitola(inv.cigar),
                wrapper_name=inv.cigar.wrapper.name if inv.cigar.wrapper else None,
                country_name=inv.cigar.country.name if inv.cigar.country else None,
                strength_name=inv.cigar.strength.name if inv.cigar.strength else None,
                humidor_name=h.name,
                quantity=inv.quantity,
            )
            for inv in h.inventory_items
            if inv.quantity > 0
        ]
        return GuestHumidorResponse(
            id=h.id,
            name=h.name,
            description=h.description,
            capacity=h.capacity,
            target_humidity=h.target_humidity,
            target_temp_f=h.target_temp_f,
            cigars=cigars,
        )

    return [_build_humidor(h) for h in humidors]


@router.get("/g/{token}/want-list", response_model=list[GuestWantListResponse])
async def guest_want_list(
    token: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[GuestWantListResponse]:
    link = await get_guest_link(token, db)
    check_guest_permission(link, "want_list")

    result = await db.execute(
        select(WantList)
        .where(
            WantList.user_id == link.user_id,
            WantList.fulfilled == False,  # noqa: E712
        )
        .options(
            joinedload(WantList.cigar).joinedload(Cigar.brand),
            joinedload(WantList.cigar).joinedload(Cigar.vitola),
        )
        .offset(skip)
        .limit(limit)
    )
    items = result.unique().scalars().all()

    return [
        GuestWantListResponse(
            id=item.id,
            cigar_brand=item.cigar.brand.name if item.cigar and item.cigar.brand else None,
            cigar_line=item.cigar.line.name if item.cigar and item.cigar.line else None,
            cigar_vitola=_cigar_vitola(item.cigar) if item.cigar else None,
            notes=item.notes,
            priority=item.priority,
        )
        for item in items
    ]


@router.get("/g/{token}/swap-list", response_model=list[GuestSwapListResponse])
async def guest_swap_list(
    token: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[GuestSwapListResponse]:
    link = await get_guest_link(token, db)
    check_guest_permission(link, "swap_list")

    result = await db.execute(
        select(SwapListItem)
        .where(
            SwapListItem.user_id == link.user_id,
            SwapListItem.is_active == True,  # noqa: E712
        )
        .options(
            joinedload(SwapListItem.inventory).options(
                joinedload(Inventory.cigar).joinedload(Cigar.brand),
                joinedload(Inventory.cigar).joinedload(Cigar.vitola),
            )
        )
        .offset(skip)
        .limit(limit)
    )
    items = result.unique().scalars().all()

    return [
        GuestSwapListResponse(
            id=item.id,
            cigar_brand=item.inventory.cigar.brand.name if item.inventory.cigar.brand else None,
            cigar_line=item.inventory.cigar.line.name if item.inventory.cigar.line else None,
            cigar_vitola=_cigar_vitola(item.inventory.cigar),
            max_quantity=item.max_quantity,
            notes=item.notes,
        )
        for item in items
    ]
