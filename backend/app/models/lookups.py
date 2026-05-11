from sqlalchemy import Column, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey, CommunityLookupMixin


class Manufacturer(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "manufacturers"

    name = Column(String(200), nullable=False)
    website = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True)

    brands = relationship("Brand", back_populates="manufacturer")


class Brand(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "brands"

    name = Column(String(200), nullable=False)
    manufacturer_id = Column(UUID(as_uuid=True), ForeignKey("manufacturers.id"), nullable=True)
    country = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)

    manufacturer = relationship("Manufacturer", back_populates="brands")
    lines = relationship(
        "Line",
        back_populates="brand",
        cascade="save-update, merge",
    )


class Line(Base, UUIDPrimaryKey, CommunityLookupMixin):
    """Cigar line within a brand (e.g., 1964 Anniversary, Hemingway).

    Community-managed lookup table scoped by brand FK. The (name, brand_id)
    combination is unique — the same line name may exist across different
    brands (multiple brands have "Connecticut", "Maduro", etc.).
    """

    __tablename__ = "lines"

    __table_args__ = (
        UniqueConstraint("name", "brand_id", name="uq_lines_name_brand"),
        Index("ix_lines_brand_id_name", "brand_id", "name"),
    )

    name = Column(String(200), nullable=False)
    brand_id = Column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    brand = relationship("Brand", back_populates="lines", lazy="joined")


class Vitola(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "vitolas"

    name = Column(String(100), nullable=False)
    length_inches = Column(Numeric(3, 1), nullable=True)
    ring_gauge = Column(Integer, nullable=True)
    category = Column(String(20), nullable=True)


class Wrapper(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "wrappers"

    name = Column(String(100), nullable=False)
    color_category = Column(String(30), nullable=True)
    origin_region = Column(String(100), nullable=True)


class Binder(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "binders"

    name = Column(String(100), nullable=False)
    origin_region = Column(String(100), nullable=True)


class Filler(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "fillers"

    name = Column(String(100), nullable=False)
    country = Column(String(100), nullable=True)
    priming = Column(String(50), nullable=True)


class Country(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "countries"

    name = Column(String(100), nullable=False)
    iso_code = Column(String(3), nullable=True)


class StrengthLevel(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "strength_levels"

    name = Column(String(30), nullable=False)
    sort_order = Column(Integer, nullable=False)


class FlavorTag(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "flavor_tags"

    name = Column(String(50), nullable=False)
    category = Column(String(50), nullable=True)


class PurchaseType(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "purchase_types"

    name = Column(String(50), nullable=False)


class Environment(Base, UUIDPrimaryKey, CommunityLookupMixin):
    __tablename__ = "environments"

    name = Column(String(50), nullable=False)
