from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB
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

    humidors = relationship("Humidor", back_populates="user")
    inventory_items = relationship("Inventory", back_populates="user")
    smoking_sessions = relationship("SmokingSession", back_populates="user")
