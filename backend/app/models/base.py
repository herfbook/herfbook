from sqlalchemy import Boolean, Column, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class UUIDPrimaryKey:
    @declared_attr
    def id(cls):
        return Column(
            UUID(as_uuid=True),
            primary_key=True,
            server_default=text("gen_random_uuid()"),
        )


class TimestampMixin:
    @declared_attr
    def created_at(cls):
        return Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
        )

    @declared_attr
    def updated_at(cls):
        # onupdate=func.now() covers ORM updates. For raw SQL updates,
        # a PostgreSQL trigger would be needed for full coverage.
        return Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=text("now()"),
            onupdate=func.now(),
        )


class CommunityLookupMixin:
    @declared_attr
    def source(cls):
        return Column(String(20), nullable=False, default="community")

    @declared_attr
    def community_key(cls):
        return Column(String(200), unique=True, index=True, nullable=True)

    @declared_attr
    def is_imported(cls):
        return Column(Boolean, nullable=False, default=False)

    @declared_attr
    def is_active(cls):
        return Column(Boolean, nullable=False, default=True)
