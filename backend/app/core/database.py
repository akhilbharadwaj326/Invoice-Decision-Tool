"""
core/database.py — Async SQLAlchemy engine + session factory.
DATABASE_URL comes entirely from settings — never hardcoded here.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,      # Logs SQL in dev, silent in prod
    pool_pre_ping=True,       # Verify connection before each use (handles Neon idle timeouts)
    pool_size=5,
    max_overflow=10,
)

# ── Session Factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ── ORM Base ──────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass

# ── Request-scoped DB dependency ──────────────────────────────────────────────
async def get_db():
    """
    FastAPI dependency — yields one DB session per request, auto-commits or rolls back.
    Usage in any route:
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
