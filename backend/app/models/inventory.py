from sqlalchemy import Boolean, Column, Date, DateTime, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class Inventory(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "inventory"

    __table_args__ = (
        Index("ix_inventory_user_humidor", "user_id", "humidor_id"),
        Index("ix_inventory_user_cigar", "user_id", "cigar_id"),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    humidor_id = Column(UUID(as_uuid=True), ForeignKey("humidors.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(8, 2), nullable=True)
    price_per_stick = Column(Numeric(8, 2), nullable=True)
    vendor = Column(String(200), nullable=True)
    vendor_url = Column(String(500), nullable=True)
    purchase_type_id = Column(UUID(as_uuid=True), ForeignKey("purchase_types.id"), nullable=True)
    box_code = Column(String(50), nullable=True)
    date_added_humidor = Column(Date, nullable=True)
    is_gift = Column(Boolean, nullable=False, default=False)
    gift_from = Column(String(200), nullable=True)
    gift_occasion = Column(String(200), nullable=True)
    gift_to = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="inventory_items")
    cigar = relationship("Cigar", back_populates="inventory_items")
    humidor = relationship("Humidor", back_populates="inventory_items")
    purchase_type = relationship("PurchaseType")
    transfers = relationship("InventoryTransfer", back_populates="inventory")


class InventoryTransfer(Base, UUIDPrimaryKey):
    __tablename__ = "inventory_transfers"

    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    from_humidor_id = Column(UUID(as_uuid=True), ForeignKey("humidors.id"), nullable=True)
    to_humidor_id = Column(UUID(as_uuid=True), ForeignKey("humidors.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    transferred_at = Column(DateTime(timezone=True), nullable=False)
    notes = Column(Text, nullable=True)

    inventory = relationship("Inventory", back_populates="transfers")
    from_humidor = relationship("Humidor", foreign_keys=[from_humidor_id])
    to_humidor = relationship("Humidor", foreign_keys=[to_humidor_id])
