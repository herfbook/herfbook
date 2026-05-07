from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class User(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "users"

    username = Column(String(100), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=True)
    sharing_defaults = Column(JSONB, nullable=True)
    preferences = Column(JSONB, nullable=True)
    api_key = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False)

    humidors = relationship("Humidor", back_populates="user")
    inventory_items = relationship("Inventory", back_populates="user")
    smoking_sessions = relationship("SmokingSession", back_populates="user")


class RefreshToken(Base, UUIDPrimaryKey):
    __tablename__ = "refresh_tokens"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    jti = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    user = relationship("User", backref="refresh_tokens")
