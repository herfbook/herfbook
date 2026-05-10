"""Tests for the community lookup sync engine.

The pure-unit pieces (slugify, LocalYAMLProvider) run unconditionally.
The full sync_all_lookups tests need a real Postgres — they're skipped
unless TEST_DATABASE_URL is set (e.g., to the dev compose DB).
"""
from __future__ import annotations

import asyncio
import os
from pathlib import Path

import pytest

from app.services.providers.local_yaml import LocalYAMLProvider
from app.utils.slugify import slugify


# ---------------------------------------------------------------------------
# slugify
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("Connecticut Shade", "connecticut-shade"),
        ("Padrón", "padron"),
        ("Romeo y Julieta (Cuba)", "romeo-y-julieta-cuba"),
        ("  Whitespace  ", "whitespace"),
        ("Multiple   Spaces", "multiple-spaces"),
        ("Hyphen-already-here", "hyphen-already-here"),
        ("Mixed_Underscores", "mixed-underscores"),
        ("MiXeD CaSe", "mixed-case"),
        ("A.J. Fernandez", "a-j-fernandez"),
        ("5 Vegas", "5-vegas"),
        ("---leading and trailing---", "leading-and-trailing"),
    ],
)
def test_slugify_handles_common_inputs(raw: str, expected: str) -> None:
    assert slugify(raw) == expected


def test_slugify_strips_non_ascii_punctuation() -> None:
    assert slugify("La Aurora — 110 Aniversario") == "la-aurora-110-aniversario"


# ---------------------------------------------------------------------------
# LocalYAMLProvider
# ---------------------------------------------------------------------------


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro) if asyncio._get_running_loop() else asyncio.run(coro)


def test_local_yaml_provider_returns_empty_for_missing_file(tmp_path: Path) -> None:
    provider = LocalYAMLProvider(tmp_path)
    result = asyncio.run(provider.load_table("brands"))
    assert result == []


def test_local_yaml_provider_loads_entries(tmp_path: Path) -> None:
    (tmp_path / "brands.yml").write_text(
        "brands:\n"
        "  - name: Padron\n"
        "    country: Nicaragua\n"
        "  - name: My Father\n"
        "    country: Nicaragua\n",
        encoding="utf-8",
    )
    provider = LocalYAMLProvider(tmp_path)
    result = asyncio.run(provider.load_table("brands"))
    assert len(result) == 2
    assert result[0]["name"] == "Padron"
    assert result[1]["country"] == "Nicaragua"


def test_local_yaml_provider_returns_empty_for_empty_file(tmp_path: Path) -> None:
    (tmp_path / "brands.yml").write_text("", encoding="utf-8")
    provider = LocalYAMLProvider(tmp_path)
    assert asyncio.run(provider.load_table("brands")) == []


def test_local_yaml_provider_returns_empty_for_wrong_top_key(tmp_path: Path) -> None:
    (tmp_path / "brands.yml").write_text("not_brands:\n  - name: foo\n", encoding="utf-8")
    provider = LocalYAMLProvider(tmp_path)
    assert asyncio.run(provider.load_table("brands")) == []


# ---------------------------------------------------------------------------
# Full sync — needs a real database
# ---------------------------------------------------------------------------


_TEST_DB_URL = os.getenv("TEST_DATABASE_URL")
_skip_if_no_db = pytest.mark.skipif(
    _TEST_DB_URL is None,
    reason="TEST_DATABASE_URL not set; integration tests skipped",
)


@pytest.fixture
def yaml_dir(tmp_path: Path) -> Path:
    """Tiny YAML fixture with two manufacturers and two brands (one
    pointing at a manufacturer, one orphan)."""
    (tmp_path / "manufacturers.yml").write_text(
        "manufacturers:\n"
        "  - name: Padron Cigars\n"
        "    country: Nicaragua\n"
        "  - name: My Father Cigars\n"
        "    country: Nicaragua\n",
        encoding="utf-8",
    )
    (tmp_path / "brands.yml").write_text(
        "brands:\n"
        "  - name: Padron\n"
        "    manufacturer: Padron Cigars\n"
        "    country: Nicaragua\n"
        "  - name: Phantom Brand\n"
        "    manufacturer: Nonexistent Co.\n",
        encoding="utf-8",
    )
    return tmp_path


@_skip_if_no_db
def test_first_run_creates_with_is_imported_true(yaml_dir: Path) -> None:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.models.lookups import Brand, Manufacturer
    from app.services.community_sync import sync_all_lookups

    async def _run_test() -> None:
        engine = create_async_engine(_TEST_DB_URL, future=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        provider = LocalYAMLProvider(yaml_dir)

        async with Session() as session:
            stats = await sync_all_lookups(session, provider)

        async with Session() as session:
            padron = (
                await session.execute(
                    select(Manufacturer).where(Manufacturer.community_key == "padron-cigars")
                )
            ).scalar_one()
            assert padron.is_imported is True
            assert padron.source == "community"

            padron_brand = (
                await session.execute(
                    select(Brand).where(Brand.community_key == "padron")
                )
            ).scalar_one()
            assert padron_brand.manufacturer_id == padron.id

            phantom = (
                await session.execute(
                    select(Brand).where(Brand.community_key == "phantom-brand")
                )
            ).scalar_one()
            assert phantom.manufacturer_id is None
        await engine.dispose()

        assert stats["manufacturers"]["created"] >= 2
        assert stats["brands"]["created"] >= 2

    asyncio.run(_run_test())


@_skip_if_no_db
def test_second_run_does_not_duplicate(yaml_dir: Path) -> None:
    from sqlalchemy import func, select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.models.lookups import Manufacturer
    from app.services.community_sync import sync_all_lookups

    async def _run_test() -> None:
        engine = create_async_engine(_TEST_DB_URL, future=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        provider = LocalYAMLProvider(yaml_dir)

        async with Session() as session:
            await sync_all_lookups(session, provider)
        async with Session() as session:
            stats2 = await sync_all_lookups(session, provider)

        async with Session() as session:
            count = await session.scalar(
                select(func.count())
                .select_from(Manufacturer)
                .where(Manufacturer.community_key == "padron-cigars")
            )
            assert count == 1
        await engine.dispose()

        assert stats2["manufacturers"]["created"] == 0


@_skip_if_no_db
def test_orphan_demotion(tmp_path: Path) -> None:
    """A community row whose YAML entry disappears is demoted to local."""
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.models.lookups import Manufacturer
    from app.services.community_sync import sync_all_lookups

    initial = tmp_path / "initial"
    initial.mkdir()
    (initial / "manufacturers.yml").write_text(
        "manufacturers:\n  - name: Goes Away Soon\n", encoding="utf-8"
    )

    final = tmp_path / "final"
    final.mkdir()
    (final / "manufacturers.yml").write_text(
        "manufacturers:\n  - name: Stays\n", encoding="utf-8"
    )

    async def _run_test() -> None:
        engine = create_async_engine(_TEST_DB_URL, future=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)

        async with Session() as session:
            await sync_all_lookups(session, LocalYAMLProvider(initial))
        async with Session() as session:
            await sync_all_lookups(session, LocalYAMLProvider(final))

        async with Session() as session:
            orphan = (
                await session.execute(
                    select(Manufacturer).where(
                        Manufacturer.name == "Goes Away Soon"
                    )
                )
            ).scalar_one()
            assert orphan.source == "local"
            assert orphan.community_key is None
        await engine.dispose()

    asyncio.run(_run_test())
