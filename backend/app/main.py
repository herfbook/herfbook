from fastapi import FastAPI, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.routers import auth, cigars, guests, humidors, inventory, ratings, sessions, setup, swaps, want_list

app = FastAPI(title="HerfBook API", version="0.1.0")

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


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    user_count = await db.scalar(select(func.count()).select_from(User))
    return {"status": "ok", "version": "0.1.0", "setup_required": user_count == 0}
