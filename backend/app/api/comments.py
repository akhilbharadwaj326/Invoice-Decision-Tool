from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import uuid

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.models.models import Invoice, InvoiceComment, User
from app.schemas.schemas import CommentRequest, CommentResponse, MessageResponse
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/invoices", tags=["Comments"])


@router.post("/{invoice_id}/comments", response_model=CommentResponse)
async def add_comment(
    invoice_id: uuid.UUID,
    payload: CommentRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """
    Add a comment to an invoice.
    """
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    comment = InvoiceComment(
        invoice_id=invoice.id,
        user_id=current_user.id,
        comment=payload.comment,
        is_internal=payload.is_internal
    )
    db.add(comment)
    
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="COMMENT",
        invoice_id=invoice.id,
        payload={"is_internal": payload.is_internal}
    )

    await db.commit()
    await db.refresh(comment)
    
    # We need to return user_name in response, so fetch it
    user_result = await db.execute(select(User.name).where(User.id == current_user.id))
    user_name = user_result.scalar()

    return CommentResponse(
        id=comment.id,
        invoice_id=comment.invoice_id,
        comment=comment.comment,
        is_internal=comment.is_internal,
        created_at=comment.created_at,
        user_name=user_name
    )


@router.get("/{invoice_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    invoice_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all comments for an invoice.
    """
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Fetch comments and join with User to get names
    stmt = (
        select(InvoiceComment, User.name)
        .join(User, InvoiceComment.user_id == User.id)
        .where(InvoiceComment.invoice_id == invoice_id)
        .order_by(InvoiceComment.created_at.asc())
    )
    comments_result = await db.execute(stmt)
    
    responses = []
    for comment, user_name in comments_result:
        responses.append(CommentResponse(
            id=comment.id,
            invoice_id=comment.invoice_id,
            comment=comment.comment,
            is_internal=comment.is_internal,
            created_at=comment.created_at,
            user_name=user_name
        ))
        
    return responses
