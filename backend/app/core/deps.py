"""
core/deps.py — FastAPI dependency injection: auth + role-based access guards.
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.models import User

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts Bearer token → verifies JWT → fetches user from DB.
    Raises 401 if missing/invalid, 403 if inactive.
    """
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user_id = verify_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    return user


# Convenience type alias — use in route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]


# ── Role Guards ───────────────────────────────────────────────────────────────

def require_roles(*roles: str):
    """
    Factory that returns a FastAPI dependency enforcing one of the given roles.

    Usage:
        @router.post("/upload")
        async def upload(user = Depends(require_roles("REVIEWER", "APPROVER", "ADMIN"))):
    """
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}",
            )
        return current_user
    return _check


# Pre-built guards matching the permission matrix
def require_reviewer():
    return require_roles("REVIEWER", "APPROVER", "ADMIN")

def require_approver():
    return require_roles("APPROVER", "ADMIN")

def require_admin():
    return require_roles("ADMIN")
