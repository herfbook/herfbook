from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.tokens import decode_token
from app.database import get_db
from app.models.guest import GuestLink
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_guest_link(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> GuestLink:
    """Validate guest token and return the GuestLink.

    Uses 404 for all failure cases to avoid revealing whether a link exists.
    Updates last_accessed on valid access.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(select(GuestLink).where(GuestLink.token == token))
    link = result.scalar_one_or_none()
    if link is None or not link.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if link.expires_at is not None and link.expires_at < now:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    link.last_accessed = now
    await db.commit()
    return link


def check_guest_permission(guest_link: GuestLink, required: str) -> None:
    if required not in (guest_link.permissions or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This link does not have '{required}' access",
        )


async def get_current_user_optional(
    token: str | None = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if token is None:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
