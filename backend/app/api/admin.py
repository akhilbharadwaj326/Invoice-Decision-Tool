from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uuid

from app.core.database import get_db
from app.core.deps import CurrentUser, require_admin
from app.models.models import User, RiskRule
from app.schemas.schemas import UserResponse, UserUpdateRequest, RiskRuleResponse, RiskRuleUpdateRequest
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    List all users. Requires ADMIN role.
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's role or active status.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload.role is not None:
        valid_roles = ["VIEWER", "REVIEWER", "APPROVER", "ADMIN"]
        if payload.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {valid_roles}")
        user.role = payload.role
        
    if payload.is_active is not None:
        user.is_active = payload.is_active
        
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="USER_UPDATE",
        payload={"target_user_id": str(user.id), "role": payload.role, "is_active": payload.is_active}
    )

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/rules", response_model=list[RiskRuleResponse])
async def list_rules(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    List all risk rules.
    """
    result = await db.execute(select(RiskRule).order_by(RiskRule.rule_code.asc()))
    return result.scalars().all()


@router.patch("/rules/{rule_id}", response_model=RiskRuleResponse)
async def update_rule(
    rule_id: uuid.UUID,
    payload: RiskRuleUpdateRequest,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle a risk rule or update its threshold.
    """
    result = await db.execute(select(RiskRule).where(RiskRule.id == rule_id))
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Risk rule not found")
        
    if payload.is_active is not None:
        rule.is_active = payload.is_active
    
    if payload.threshold is not None:
        rule.threshold = payload.threshold
        
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="RULE_UPDATE",
        payload={"rule_code": rule.rule_code, "is_active": payload.is_active, "threshold": payload.threshold}
    )

    await db.commit()
    await db.refresh(rule)
    return rule
