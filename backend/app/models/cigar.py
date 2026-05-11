from sqlalchemy import Boolean, Column, DateTime, Index, Integer, Numeric, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class Cigar(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "cigars"

    __table_args__ = (
        Index("ix_cigars_user_brand", "user_id", "brand_id"),
    )

    community_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    line_id = Column(
        UUID(as_uuid=True),
        ForeignKey("lines.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    vitola_id = Column(UUID(as_uuid=True), ForeignKey("vitolas.id"), nullable=True)
    custom_vitola_name = Column(String(100), nullable=True)
    custom_length = Column(Numeric(3, 1), nullable=True)
    custom_ring_gauge = Column(Integer, nullable=True)
    wrapper_id = Column(UUID(as_uuid=True), ForeignKey("wrappers.id"), nullable=True)
    binder_id = Column(UUID(as_uuid=True), ForeignKey("binders.id"), nullable=True)
    country_id = Column(UUID(as_uuid=True), ForeignKey("countries.id"), nullable=True)
    manufacturer_id = Column(UUID(as_uuid=True), ForeignKey("manufacturers.id"), nullable=True)
    strength_id = Column(UUID(as_uuid=True), ForeignKey("strength_levels.id"), nullable=True)
    upc = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    is_user_created = Column(Boolean, nullable=False, default=True)
    submission_status = Column(String(20), nullable=True)

    user = relationship("User")
    brand = relationship("Brand")
    line = relationship("Line", lazy="joined", foreign_keys=[line_id])
    vitola = relationship("Vitola")
    wrapper = relationship("Wrapper")
    binder = relationship("Binder")
    country = relationship("Country")
    manufacturer = relationship("Manufacturer")
    strength = relationship("StrengthLevel")
    fillers = relationship("Filler", secondary="cigar_fillers", viewonly=True)
    cigar_fillers_assoc = relationship("CigarFiller", back_populates="cigar")
    images = relationship("CigarImage", back_populates="cigar")
    inventory_items = relationship("Inventory", back_populates="cigar")
    smoking_sessions = relationship("SmokingSession", back_populates="cigar")


class CigarFiller(Base, UUIDPrimaryKey):
    __tablename__ = "cigar_fillers"

    __table_args__ = (
        UniqueConstraint("cigar_id", "filler_id", name="uq_cigar_fillers_cigar_filler"),
    )

    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    filler_id = Column(UUID(as_uuid=True), ForeignKey("fillers.id"), nullable=False)

    cigar = relationship("Cigar", back_populates="cigar_fillers_assoc")
    filler = relationship("Filler")


class CigarImage(Base, UUIDPrimaryKey):
    __tablename__ = "cigar_images"

    __table_args__ = (
        Index("ix_cigar_images_cigar", "cigar_id", "sort_order"),
    )

    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(20), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)
    contributed = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    cigar = relationship("Cigar", back_populates="images")
    user = relationship("User")
