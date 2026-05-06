from fastapi import FastAPI, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.routers import auth, humidors, setup

app = FastAPI(title="HerfBook API", version="0.1.0")

app.include_router(auth.router, tags=["Authentication"])
app.include_router(setup.router, tags=["Setup"])
app.include_router(humidors.router, prefix="/humidors", tags=["humidors"])


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    user_count = await db.scalar(select(func.count()).select_from(User))
    return {"status": "ok", "version": "0.1.0", "setup_required": user_count == 0}
