from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.core.database import get_db
from app.core.deps import CurrentUser, require_reviewer
from app.models.models import Invoice, Decision, User
from app.schemas.schemas import DecisionRequest, DecisionResponse, MessageResponse
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/invoices", tags=["Decisions"])


@router.post("/{invoice_id}/decisions", response_model=DecisionResponse)
async def make_decision(
    invoice_id: uuid.UUID,
    payload: DecisionRequest,
    current_user: User = Depends(require_reviewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Make a final decision on an invoice (APPROVED, REJECTED, ON_HOLD).
    Requires REVIEWER or ADMIN role.
    """

    valid_decisions = ["APPROVED", "REJECTED", "ON_HOLD"]
    if payload.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Must be one of {valid_decisions}")

    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status in ["APPROVED", "REJECTED", "ARCHIVED"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot change decision for invoice in {invoice.status} status"
        )

    # 1. Update Invoice Status
    invoice.status = payload.decision

    # 2. Log Decision
    decision_log = Decision(
        invoice_id=invoice.id,
        decided_by=current_user.id,
        decision=payload.decision,
        reason=payload.reason,
        override_reason=payload.override_reason
    )
    db.add(decision_log)
    
    action_map = {
        "APPROVED": "APPROVE",
        "REJECTED": "REJECT",
        "ON_HOLD": "ON_HOLD"
    }
    
    # 3. Log Audit Trail
    await log_audit(
        db=db,
        user_id=current_user.id,
        action=action_map.get(payload.decision, payload.decision),
        invoice_id=invoice.id,
        payload={"reason": payload.reason, "override_reason": payload.override_reason}
    )

    await db.commit()
    await db.refresh(decision_log)

    return decision_log
