from sqlalchemy import Column, Date, DateTime, Index, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base, UUIDPrimaryKey


class CigarExternalRating(Base, UUIDPrimaryKey):
    __tablename__ = "cigar_external_ratings"

    __table_args__ = (
        Index("ix_ratings_cigar_user", "cigar_id", "user_id"),
    )

    cigar_id = Column(UUID(as_uuid=True), ForeignKey("cigars.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    source_name = Column(String(100), nullable=False)
    score = Column(Numeric(4, 1), nullable=True)
    review_url = Column(String(500), nullable=True)
    review_date = Column(Date, nullable=True)
    reviewer_name = Column(String(100), nullable=True)
    personal_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("now()"))

    cigar = relationship("Cigar")
    user = relationship("User")
