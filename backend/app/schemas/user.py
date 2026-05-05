from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = Field(None, max_length=100)
    preferences: dict | None = None
    sharing_defaults: dict | None = None

    model_config = ConfigDict(extra="forbid")
