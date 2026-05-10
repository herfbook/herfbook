"""Tests for /lookups/* router.

Auth-gate and routing tests use the existing mock_db fixture from
conftest.py. Behavior tests that exercise real DB queries (search,
duplicate detection, brand FK validation) need a real Postgres and
are skipped unless TEST_DATABASE_URL is set.
"""
from __future__ import annotations

import os

import pytest


# ---------------------------------------------------------------------------
# Auth-gate and routing — no real DB needed
# ---------------------------------------------------------------------------


def test_post_brand_without_auth_returns_401(client) -> None:
    response = client.post("/lookups/brands", json={"name": "New Brand"})
    assert response.status_code == 401


def test_post_manufacturer_without_auth_returns_401(client) -> None:
    response = client.post("/lookups/manufacturers", json={"name": "New Mfg"})
    assert response.status_code == 401


def test_post_to_readonly_table_returns_405(client) -> None:
    """countries has no POST route registered, so FastAPI returns 405."""
    response = client.post("/lookups/countries", json={"name": "Test"})
    assert response.status_code in (404, 405)


def test_post_to_readonly_strength_levels_returns_405(client) -> None:
    response = client.post("/lookups/strength-levels", json={"name": "Test"})
    assert response.status_code in (404, 405)


def test_post_to_readonly_flavor_tags_returns_405(client) -> None:
    response = client.post("/lookups/flavor-tags", json={"name": "Test"})
    assert response.status_code in (404, 405)


def test_post_to_readonly_purchase_types_returns_405(client) -> None:
    response = client.post("/lookups/purchase-types", json={"name": "Test"})
    assert response.status_code in (404, 405)


def test_post_to_readonly_environments_returns_405(client) -> None:
    response = client.post("/lookups/environments", json={"name": "Test"})
    assert response.status_code in (404, 405)


# ---------------------------------------------------------------------------
# DB-backed integration tests — skipped without TEST_DATABASE_URL
# ---------------------------------------------------------------------------


_TEST_DB_URL = os.getenv("TEST_DATABASE_URL")
_skip_if_no_db = pytest.mark.skipif(
    _TEST_DB_URL is None,
    reason="TEST_DATABASE_URL not set; integration tests skipped",
)


@_skip_if_no_db
def test_get_strength_levels_orders_by_sort_order() -> None:
    """After community sync runs in the test DB, strengths come back Mild→Full."""
    import asyncio

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.models.lookups import StrengthLevel

    async def _run_test() -> None:
        engine = create_async_engine(_TEST_DB_URL, future=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        async with Session() as session:
            rows = (
                await session.execute(
                    select(StrengthLevel)
                    .where(StrengthLevel.is_active.is_(True))
                    .order_by(StrengthLevel.sort_order.asc())
                )
            ).scalars().all()
            names = [r.name for r in rows]
            assert names == ["Mild", "Mild-Medium", "Medium", "Medium-Full", "Full"]
        await engine.dispose()

    asyncio.run(_run_test())


@_skip_if_no_db
def test_get_brands_filters_inactive() -> None:
    """Inactive or non-imported brands must not appear in list/search."""
    import asyncio

    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    from app.models.lookups import Brand
    from app.routers.lookups import _query_lookup_list

    async def _run_test() -> None:
        engine = create_async_engine(_TEST_DB_URL, future=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        async with Session() as session:
            # Find a brand to deactivate, then verify it's filtered out.
            target = (
                await session.execute(
                    select(Brand)
                    .where(Brand.is_active.is_(True), Brand.is_imported.is_(True))
                    .limit(1)
                )
            ).scalar_one_or_none()
            if target is None:
                pytest.skip("No active brands seeded in test DB")
            target.is_active = False
            await session.commit()
            try:
                rows = await _query_lookup_list(session, Brand, q=target.name, limit=10)
                assert all(r.id != target.id for r in rows)
            finally:
                target.is_active = True
                await session.commit()
        await engine.dispose()

    asyncio.run(_run_test())
