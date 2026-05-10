"""Community lookup sync engine.

Implements DESIGN.md §4.4. For each lookup table, loads the YAML entries
from a CommunityDataProvider and reconciles them with the DB:

- Match existing rows by community_key (preferred) then by name (fallback).
- Sync only touches rows where source="community". User and local rows
  are left alone.
- Updates community-managed fields on matched rows but never overwrites
  source / is_imported / is_active (admin choices are preserved).
- New entries: source="community", community_key=<slug>, is_active=True,
  is_imported=True on first run for that table, False on subsequent runs.
- Orphan demotion: rows with source="community" whose community_key is no
  longer in the YAML are demoted to source="local" with community_key=NULL.
  They are not deleted — user cigars may FK them.

The sync is non-fatal: per-table failures are logged but don't abort other
tables, and total failure is logged in main.py without preventing startup.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lookups import (
    Binder,
    Brand,
    Country,
    Environment,
    Filler,
    FlavorTag,
    Manufacturer,
    PurchaseType,
    StrengthLevel,
    Vitola,
    Wrapper,
)
from app.services.providers.base import CommunityDataProvider
from app.utils.slugify import slugify


logger = logging.getLogger(__name__)


# Per-table list of field names that the YAML controls (besides `name`).
# These are the fields the sync may overwrite on matched rows.
_TABLE_FIELDS: dict[str, tuple[type, tuple[str, ...]]] = {
    "manufacturers": (Manufacturer, ("website", "country")),
    "brands": (Brand, ("country", "website")),  # manufacturer handled separately
    "vitolas": (Vitola, ("length_inches", "ring_gauge", "category")),
    "wrappers": (Wrapper, ("color_category", "origin_region")),
    "binders": (Binder, ("origin_region",)),
    "fillers": (Filler, ("country", "priming")),
    "countries": (Country, ("iso_code",)),
    "strength_levels": (StrengthLevel, ("sort_order",)),
    "flavor_tags": (FlavorTag, ("category",)),
    "purchase_types": (PurchaseType, ()),
    "environments": (Environment, ()),
}

# Sync order matters: manufacturers before brands so brand→manufacturer
# FK resolution finds rows by community_key.
_SYNC_ORDER: tuple[str, ...] = (
    "manufacturers",
    "brands",
    "vitolas",
    "wrappers",
    "binders",
    "fillers",
    "countries",
    "strength_levels",
    "flavor_tags",
    "purchase_types",
    "environments",
)


async def sync_all_lookups(
    db: AsyncSession,
    provider: CommunityDataProvider,
) -> dict[str, dict[str, int]]:
    """Sync all 11 lookup tables. Returns per-table stats:
    {"brands": {"created": 12, "updated": 5, "demoted": 0}, ...}
    """
    stats: dict[str, dict[str, int]] = {}
    for table_name in _SYNC_ORDER:
        try:
            stats[table_name] = await _sync_table(db, provider, table_name)
        except Exception as exc:  # non-fatal: log and continue with other tables
            logger.exception("Sync failed for table %s: %s", table_name, exc)
            stats[table_name] = {"created": 0, "updated": 0, "demoted": 0, "error": 1}
    await db.commit()
    return stats


async def _sync_table(
    db: AsyncSession,
    provider: CommunityDataProvider,
    table_name: str,
) -> dict[str, int]:
    model, managed_fields = _TABLE_FIELDS[table_name]

    yaml_entries = await provider.load_table(table_name)
    if not yaml_entries:
        logger.info("No YAML entries for %s; skipping", table_name)
        return {"created": 0, "updated": 0, "demoted": 0}

    # First-run detection: per-table, based on community-source rows.
    existing_count = await db.scalar(
        select(func.count())
        .select_from(model)
        .where(model.source == "community")
    )
    is_first_run = (existing_count or 0) == 0

    seen_keys: set[str] = set()
    created = 0
    updated = 0

    for entry in yaml_entries:
        name = entry.get("name")
        if not name:
            logger.warning("%s: skipping entry with no name: %r", table_name, entry)
            continue
        key = slugify(name)
        if not key:
            logger.warning("%s: empty slug for name %r; skipping", table_name, name)
            continue
        seen_keys.add(key)

        row = await _find_existing(db, model, key, name)

        if row is None:
            row = model(
                name=name,
                source="community",
                community_key=key,
                is_imported=is_first_run,
                is_active=True,
            )
            _apply_managed_fields(row, entry, managed_fields)
            if table_name == "brands":
                await _resolve_brand_manufacturer(db, row, entry)
            db.add(row)
            await db.flush()
            created += 1
        else:
            # Only sync community rows. Don't touch user or local rows.
            if row.source != "community":
                continue
            # Backfill community_key if matched by name.
            if row.community_key != key:
                row.community_key = key
            # Always sync `name` so casing fixes propagate.
            row.name = name
            _apply_managed_fields(row, entry, managed_fields)
            if table_name == "brands":
                await _resolve_brand_manufacturer(db, row, entry)
            updated += 1

    demoted = await _demote_orphans(db, model, seen_keys)

    return {"created": created, "updated": updated, "demoted": demoted}


async def _find_existing(
    db: AsyncSession,
    model: type,
    community_key: str,
    name: str,
):
    # Fast path: by community_key.
    row = (
        await db.execute(select(model).where(model.community_key == community_key))
    ).scalar_one_or_none()
    if row is not None:
        return row

    # Fallback: by name (case-insensitive), but ONLY for community rows.
    # User rows must never be matched here — that would risk false orphan
    # demotion or overwriting user data.
    row = (
        await db.execute(
            select(model).where(
                func.lower(model.name) == name.lower(),
                model.source == "community",
            )
        )
    ).scalar_one_or_none()
    return row


def _apply_managed_fields(
    row: Any,
    entry: dict,
    managed_fields: tuple[str, ...],
) -> None:
    for field in managed_fields:
        if field in entry:
            setattr(row, field, entry[field])


async def _resolve_brand_manufacturer(
    db: AsyncSession,
    brand_row: Brand,
    entry: dict,
) -> None:
    manufacturer_name = entry.get("manufacturer")
    if not manufacturer_name:
        brand_row.manufacturer_id = None
        return
    key = slugify(manufacturer_name)
    if not key:
        brand_row.manufacturer_id = None
        return
    manufacturer = (
        await db.execute(
            select(Manufacturer).where(Manufacturer.community_key == key)
        )
    ).scalar_one_or_none()
    if manufacturer is None:
        logger.warning(
            "Brand %r references unknown manufacturer %r (slug=%s); leaving FK NULL",
            brand_row.name,
            manufacturer_name,
            key,
        )
        brand_row.manufacturer_id = None
        return
    brand_row.manufacturer_id = manufacturer.id


async def _demote_orphans(
    db: AsyncSession,
    model: type,
    seen_keys: set[str],
) -> int:
    """Find community-source rows whose community_key is no longer in the
    YAML. Demote them to source='local' with community_key=NULL.
    """
    result = await db.execute(
        select(model).where(model.source == "community")
    )
    rows = result.scalars().all()
    demoted = 0
    for row in rows:
        if row.community_key not in seen_keys:
            row.source = "local"
            row.community_key = None
            demoted += 1
    return demoted
