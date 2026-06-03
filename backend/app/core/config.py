"""
core/config.py — Single source of truth for all environment variables.

Local dev  → reads from .env file at project root
Replit     → reads from Replit Secrets (same variable names, zero code change)
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",   # Safe: ignores unknown env vars (handy on Replit)
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Invoice Decision Tool"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"   # development | production
    DEBUG: bool = True

    # ── Database ─────────────────────────────────────────────────────────────
    # Local:  postgresql+asyncpg://postgres:<PASSWORD>@localhost:5432/invoice_decision_tool
    # Replit: postgresql+asyncpg://user:pass@host.neon.tech:5432/invoicedb
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/invoice_decision_tool"

    # ── JWT Auth ──────────────────────────────────────────────────────────────
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = "CHANGE_ME_generate_a_64char_hex_string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_RETRIES: int = 2
    OPENAI_TIMEOUT_SECONDS: int = 60

    # ── Supabase Storage ──────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "invoices"
    SUPABASE_SIGNED_URL_EXPIRY: int = 3600   # 1 hour

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Local:  http://localhost:5173
    # Replit: https://your-frontend.replit.app
    FRONTEND_URL: str = "http://localhost:5173"

    # ── File Upload ───────────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 20

    # ── Risk Thresholds (overridable via Admin UI) ────────────────────────────
    RISK_AMOUNT_THRESHOLD: float = 50000.0
    RISK_CONFIDENCE_THRESHOLD: float = 0.70

    # ── Computed helpers ─────────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins(self) -> list[str]:
        """Always allow the configured FRONTEND_URL. In dev, also allow localhost variants."""
        origins = {self.FRONTEND_URL}
        if not self.is_production:
            origins.update([
                "http://localhost:5173",
                "http://localhost:4173",
                "http://127.0.0.1:5173",
            ])
        return list(origins)

    @property
    def has_supabase(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SERVICE_KEY)

    @property
    def has_openai(self) -> bool:
        return bool(self.OPENAI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    """
    Cached singleton — import this everywhere instead of instantiating Settings() directly.
    Usage:
        from app.core.config import get_settings
        settings = get_settings()
    """
    return Settings()
