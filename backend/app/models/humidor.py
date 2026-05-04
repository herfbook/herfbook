from sqlalchemy import Boolean, Column, DateTime, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey


class Humidor(Base, UUIDPrimaryKey):
    __tablename__ = "humidors"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    capacity = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    target_humidity = Column(Numeric(4, 1), nullable=True)
    target_temp_f = Column(Numeric(4, 1), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User", back_populates="humidors")
    readings = relationship("HumidorReading", back_populates="humidor")
    inventory_items = relationship("Inventory", back_populates="humidor")


class HumidorReading(Base, UUIDPrimaryKey):
    __tablename__ = "humidor_readings"

    __table_args__ = (
        Index("ix_readings_humidor_recorded", "humidor_id", "recorded_at"),
    )

    humidor_id = Column(UUID(as_uuid=True), ForeignKey("humidors.id"), nullable=False)
    humidity = Column(Numeric(4, 1), nullable=True)
    temperature_f = Column(Numeric(4, 1), nullable=True)
    source = Column(String(50), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False)

    humidor = relationship("Humidor", back_populates="readings")
