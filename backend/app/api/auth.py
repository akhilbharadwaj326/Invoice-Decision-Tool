"""
api/auth.py
===========
Authentication endpoints: signup, login, get current user profile.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import CurrentUser
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User
from app.schemas.schemas import LoginRequest, MeResponse, SignupRequest, TokenResponse, UserResponse, ProfileUpdateRequest

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


@router.post("/signup", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with default role 'REVIEWER'."""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists."
        )

    # Create new user
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role="REVIEWER"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate token
    access_token = create_access_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=MeResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with JSON payload."""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    # Generate token
    access_token = create_access_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=TokenResponse)
async def login_swagger(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)):
    """Authenticate with form-data (Required for Swagger UI 'Authorize' button)."""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: CurrentUser):
    """Get the profile of the currently logged-in user."""
    # We return a dummy access token here so the frontend can refresh it easily if needed,
    # or just return the user object. The schema requires access_token.
    # In a real app we might return a fresh token here or just return UserResponse.
    # We'll just generate a fresh token for them.
    access_token = create_access_token(subject=str(current_user.id))
    return {
        "user": current_user,
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile (name and/or password)."""
    if payload.name:
        current_user.name = payload.name
    if payload.password:
        current_user.password_hash = hash_password(payload.password)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/logout", status_code=204)
async def logout(current_user: CurrentUser, response: Response):
    """
    Logout is handled client side by destroying the token, but this endpoint
    can be used to clear any refresh token cookies if we add them later.
    """
    return None
