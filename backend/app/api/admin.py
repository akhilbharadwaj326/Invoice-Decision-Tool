"""
api/admin.py
============
Admin-only endpoints: user management and risk rule management.
Requires ADMIN role on all routes.
"""

import uuid
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.models import User, RiskRule
from app.schemas.schemas import (
    UserResponse,
    UserUpdateRequest,
    CreateUserRequest,
    RiskRuleResponse,
    RiskRuleCreateRequest,
    RiskRuleUpdateRequest,
)
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Users ─────────────────────────────────────────────────────────────────────

VALID_ROLES = ["VIEWER", "REVIEWER", "APPROVER", "ADMIN"]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user. Requires ADMIN role."""
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A user with this email already exists.")

    # Validate role
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of {VALID_ROLES}",
        )

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)

    await log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_CREATE",
        payload={"email": payload.email, "role": payload.role},
    )

    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """List all users. Requires ADMIN role."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role or active status. Requires ADMIN role."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role is not None:
        if payload.role not in VALID_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Must be one of {VALID_ROLES}",
            )
        user.role = payload.role

    if payload.is_active is not None:
        user.is_active = payload.is_active

    audit_action = "USER_DEACTIVATE" if payload.is_active is False else "USER_UPDATE"
    await log_audit(
        db=db,
        user_id=current_user.id,
        action=audit_action,
        payload={
            "target_user_id": str(user.id),
            "role": payload.role,
            "is_active": payload.is_active,
        },
    )

    await db.commit()
    await db.refresh(user)
    return user


# ── Risk Rules ────────────────────────────────────────────────────────────────

VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@router.get("/rules", response_model=list[RiskRuleResponse])
async def list_rules(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """List all risk rules. Requires ADMIN role."""
    result = await db.execute(select(RiskRule).order_by(RiskRule.rule_code.asc()))
    return result.scalars().all()


@router.post("/rules", response_model=RiskRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RiskRuleCreateRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Create a new risk rule. Requires ADMIN role."""
    # Validate severity first
    if payload.severity not in VALID_SEVERITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid severity. Must be one of {VALID_SEVERITIES}",
        )

    # Check for duplicate rule_code
    result = await db.execute(
        select(RiskRule).where(RiskRule.rule_code == payload.rule_code.upper())
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A rule with this code already exists.")

    rule = RiskRule(
        rule_code=payload.rule_code.upper(),
        name=payload.name,
        description=payload.description,
        severity=payload.severity,
        threshold=payload.threshold,
        is_active=payload.is_active,
    )
    db.add(rule)

    await log_audit(
        db=db,
        user_id=current_user.id,
        action="RULE_CREATE",
        payload={
            "rule_code": payload.rule_code,
            "name": payload.name,
            "severity": payload.severity,
        },
    )

    await db.commit()
    await db.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}", response_model=RiskRuleResponse)
async def update_rule(
    rule_id: uuid.UUID,
    payload: RiskRuleUpdateRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    """Toggle or update a risk rule. Requires ADMIN role."""
    result = await db.execute(select(RiskRule).where(RiskRule.id == rule_id))
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(status_code=404, detail="Risk rule not found")

    # Apply updates only for fields that are provided
    if payload.is_active is not None:
        rule.is_active = payload.is_active

    if payload.threshold is not None:
        rule.threshold = payload.threshold

    if payload.name is not None:
        rule.name = payload.name

    if payload.description is not None:
        rule.description = payload.description

    if payload.severity is not None:
        if payload.severity not in VALID_SEVERITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid severity. Must be one of {VALID_SEVERITIES}",
            )
        rule.severity = payload.severity

    await log_audit(
        db=db,
        user_id=current_user.id,
        action="RULE_UPDATE",
        payload={
            "rule_code": rule.rule_code,
            "is_active": payload.is_active,
            "threshold": payload.threshold,
            "severity": payload.severity,
        },
    )

    await db.commit()
    await db.refresh(rule)
    return rule
