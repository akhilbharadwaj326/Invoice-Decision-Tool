"""
main.py — FastAPI application entry point.

Phase 1: Health endpoint only.
Routers for auth, invoices, etc. will be mounted in later phases.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()

# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if not settings.is_production else None,   # Swagger off in prod
    redoc_url="/redoc" if not settings.is_production else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Reads allowed origins from settings.cors_origins (env-driven)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health endpoint ───────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    """
    Liveness check — used by Replit to verify the backend is running.
    Returns 200 OK when the server is up.
    """
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# ── Routers ───────────────────────────────────────────────────────────────────
from app.api.router import api_router
app.include_router(api_router)
