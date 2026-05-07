from sqlalchemy import Boolean, Column, DateTime, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey


class WantList(Base, UUIDPrimaryKey):
    __tablename__ = "want_list"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("smoking_sessions.id"), nullable=True)
    notes = Column(Text, nullable=True)
    priority = Column(String(20), nullable=True)
    target_price = Column(Numeric(8, 2), nullable=True)
    fulfilled = Column(Boolean, nullable=False, default=False)
    fulfilled_inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")
    cigar = relationship("Cigar")
    session = relationship("SmokingSession")
    fulfilled_inventory = relationship("Inventory", foreign_keys=[fulfilled_inventory_id])
