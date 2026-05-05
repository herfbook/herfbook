from fastapi import FastAPI

from app.routers import auth

app = FastAPI(title="HerfBook API", version="0.1.0")

app.include_router(auth.router, tags=["Authentication"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
