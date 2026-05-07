from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.passwords import hash_password
from app.auth.tokens import create_access_token, create_refresh_token, decode_token
from app.database import get_db
from app.models.humidor import Humidor
from app.models.user import RefreshToken, User
from app.schemas.auth import UserResponse
from app.schemas.setup import SetupRequest, SetupResponse, SetupStatusResponse

APP_VERSION = "0.1.0"

router = APIRouter()


@router.get("/status", response_model=SetupStatusResponse)
async def setup_status(db: AsyncSession = Depends(get_db)) -> SetupStatusResponse:
    user_count = await db.scalar(select(func.count()).select_from(User))
    return SetupStatusResponse(setup_required=user_count == 0, version=APP_VERSION)


@router.post("/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup(
    body: SetupRequest,
    db: AsyncSession = Depends(get_db),
) -> SetupResponse:
    async with db.begin():
        user_count = await db.scalar(select(func.count()).select_from(User))
        if user_count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Setup already completed",
            )

        user = User(
            username=body.username,
            password_hash=hash_password(body.password),
            email=body.email,
            display_name=body.display_name,
            is_admin=True,
            preferences={
                "theme": "system",
                "temperature_unit": "fahrenheit",
                "date_format": "MM/DD/YYYY",
                "default_rating_scale": 100,
            },
            sharing_defaults={
                "share_ratings": False,
                "share_tasting_notes": False,
                "share_flavor_tags": False,
                "default_session_sharing": False,
            },
        )
        db.add(user)
        await db.flush()

        humidor = Humidor(
            user_id=user.id,
            name=body.humidor_name,
            description=body.humidor_description,
            capacity=body.humidor_capacity,
        )
        db.add(humidor)
        await db.flush()

        access_token = create_access_token(str(user.id), user.username)
        refresh_token = create_refresh_token(str(user.id))
        payload = decode_token(refresh_token)
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        db.add(
            RefreshToken(
                user_id=user.id,
                jti=payload["jti"],
                expires_at=expires_at,
            )
        )

    await db.refresh(user)
    await db.refresh(humidor)

    return SetupResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token,
        humidor_id=str(humidor.id),
    )
