from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import UserResponse


class SetupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    email: EmailStr | None = None
    display_name: str | None = Field(None, max_length=100)

    humidor_name: str = Field(default="Main Humidor", max_length=100)
    humidor_description: str | None = None
    humidor_capacity: int | None = None


class SetupStatusResponse(BaseModel):
    setup_required: bool
    version: str


class SetupResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    humidor_id: str
