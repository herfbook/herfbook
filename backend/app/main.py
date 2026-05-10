import logging
from contextlib import asynccontextmanager
from pathlib import Path

# Uvicorn's default log config only attaches handlers to the uvicorn.*
# loggers. Configure root + our app namespace at INFO so community sync
# stats and other startup messages are visible.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logging.getLogger("app").setLevel(logging.INFO)

from fastapi import Depends, FastAPI  # noqa: E402
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal, get_db
from app.models.user import User
from app.routers import (
    auth,
    cigars,
    guests,
    humidors,
    inventory,
    lookups,
    ratings,
    sessions,
    setup,
    swaps,
    want_list,
)
from app.services.community_sync import sync_all_lookups
from app.services.providers.local_yaml import LocalYAMLProvider


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.community_sync_on_startup:
        provider = LocalYAMLProvider(Path(settings.community_dir))
        try:
            async with AsyncSessionLocal() as session:
                stats = await sync_all_lookups(session, provider)
            logger.info("Community sync complete: %s", stats)
        except Exception as exc:
            logger.exception("Community sync failed (non-fatal): %s", exc)
    yield


app = FastAPI(title="HerfBook API", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router, tags=["Authentication"])
app.include_router(setup.router, tags=["Setup"])
app.include_router(humidors.router, prefix="/humidors", tags=["humidors"])
app.include_router(cigars.router, prefix="/cigars", tags=["cigars"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(sessions.router, prefix="/sessions", tags=["Smoking Journal"])
app.include_router(want_list.router, prefix="/want-list", tags=["Want List"])
app.include_router(ratings.router, prefix="/cigars", tags=["External Ratings"])
app.include_router(guests.router, tags=["Guest Access"])
app.include_router(swaps.router, prefix="/swaps", tags=["Swaps"])
app.include_router(lookups.router, prefix="/lookups", tags=["Lookups"])


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    user_count = await db.scalar(select(func.count()).select_from(User))
    return {"status": "ok", "version": "0.1.0", "setup_required": user_count == 0}
