from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey, TimestampMixin


class SmokingSession(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "smoking_sessions"

    __table_args__ = (
        Index("ix_sessions_user_smoked_at", "user_id", "smoked_at"),
        Index("ix_sessions_user_cigar", "user_id", "cigar_id"),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=True)
    smoked_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    environment_id = Column(UUID(as_uuid=True), ForeignKey("environments.id"), nullable=True)
    occasion = Column(String(200), nullable=True)
    personal_rating = Column(Integer, nullable=True)
    would_buy_again = Column(Boolean, nullable=True)
    add_to_want_list = Column(Boolean, nullable=False, default=False)
    shared_to_community = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="smoking_sessions")
    cigar = relationship("Cigar", back_populates="smoking_sessions")
    inventory = relationship("Inventory")
    environment = relationship("Environment")
    tasting_note = relationship("TastingNote", back_populates="session", uselist=False)
    flavor_tags = relationship("SessionFlavorTag", back_populates="session")
    pairings = relationship("Pairing", back_populates="session")


class TastingNote(Base, UUIDPrimaryKey):
    __tablename__ = "tasting_notes"

    session_id = Column(UUID(as_uuid=True), ForeignKey("smoking_sessions.id"), nullable=False, unique=True)
    draw_quality = Column(String(20), nullable=True)
    burn_quality = Column(String(20), nullable=True)
    ash_color = Column(String(20), nullable=True)
    ash_hold = Column(String(20), nullable=True)
    strength_first_id = Column(UUID(as_uuid=True), ForeignKey("strength_levels.id"), nullable=True)
    strength_second_id = Column(UUID(as_uuid=True), ForeignKey("strength_levels.id"), nullable=True)
    strength_third_id = Column(UUID(as_uuid=True), ForeignKey("strength_levels.id"), nullable=True)
    flavor_first = Column(Text, nullable=True)
    flavor_second = Column(Text, nullable=True)
    flavor_third = Column(Text, nullable=True)
    overall_notes = Column(Text, nullable=True)
    retrohale_notes = Column(Text, nullable=True)
    finish = Column(String(50), nullable=True)

    session = relationship("SmokingSession", back_populates="tasting_note")
    strength_first = relationship("StrengthLevel", foreign_keys=[strength_first_id])
    strength_second = relationship("StrengthLevel", foreign_keys=[strength_second_id])
    strength_third = relationship("StrengthLevel", foreign_keys=[strength_third_id])


class SessionFlavorTag(Base, UUIDPrimaryKey):
    __tablename__ = "session_flavor_tags"

    __table_args__ = (
        UniqueConstraint("session_id", "tag_id", "third", name="uq_session_flavor_tags_session_tag_third"),
    )

    session_id = Column(UUID(as_uuid=True), ForeignKey("smoking_sessions.id"), nullable=False)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("flavor_tags.id"), nullable=False)
    third = Column(String(10), nullable=True)

    session = relationship("SmokingSession", back_populates="flavor_tags")
    tag = relationship("FlavorTag")


class Pairing(Base, UUIDPrimaryKey):
    __tablename__ = "pairings"

    session_id = Column(UUID(as_uuid=True), ForeignKey("smoking_sessions.id"), nullable=False)
    type = Column(String(20), nullable=False)
    name = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)

    session = relationship("SmokingSession", back_populates="pairings")
