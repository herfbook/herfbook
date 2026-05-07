from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey


class GuestLink(Base, UUIDPrimaryKey):
    __tablename__ = "guest_links"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(64), nullable=False, unique=True)
    label = Column(String(100), nullable=True)
    permissions = Column(JSONB, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")


class SwapListItem(Base, UUIDPrimaryKey):
    __tablename__ = "swap_list_items"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    max_quantity = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    user = relationship("User")
    inventory = relationship("Inventory")


class Swap(Base, UUIDPrimaryKey):
    __tablename__ = "swaps"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    partner_name = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User")
    items = relationship("SwapItem", back_populates="swap")


class SwapItem(Base, UUIDPrimaryKey):
    __tablename__ = "swap_items"

    swap_id = Column(UUID(as_uuid=True), ForeignKey("swaps.id"), nullable=False)
    direction = Column(String(10), nullable=False)
    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)

    swap = relationship("Swap", back_populates="items")
    cigar = relationship("Cigar")
    inventory = relationship("Inventory")
