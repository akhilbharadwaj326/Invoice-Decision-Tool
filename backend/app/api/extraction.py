from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any
import uuid

from app.core.database import get_db
from app.core.deps import CurrentUser, require_reviewer
from app.models.models import Invoice, OcrExtraction, ExtractedFieldCorrection, User
from app.schemas.schemas import FieldCorrectionRequest, MessageResponse
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/invoices", tags=["Extraction Corrections"])


@router.patch("/{invoice_id}/fields", response_model=MessageResponse)
async def correct_extracted_fields(
    invoice_id: uuid.UUID,
    payload: FieldCorrectionRequest,
    current_user: User = Depends(require_reviewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Correct extracted fields for an invoice.
    Logs each field change into extracted_field_corrections.
    Requires REVIEWER or ADMIN role.
    """
    # Verify invoice exists and is not finalized
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status in ["APPROVED", "REJECTED", "ARCHIVED"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot edit fields for invoice in {invoice.status} status"
        )
        
    # Fetch OCR Extraction
    ext_result = await db.execute(select(OcrExtraction).where(OcrExtraction.invoice_id == invoice_id))
    extraction = ext_result.scalar_one_or_none()
    
    if not extraction:
        raise HTTPException(status_code=404, detail="No extraction found for this invoice")

    current_fields = extraction.extracted_fields or {}
    updated_fields = dict(current_fields)
    corrections_made = []

    for field_name, new_val in payload.fields.items():
        old_val = current_fields.get(field_name)
        
        # Only log if value actually changed
        if str(old_val) != str(new_val):
            updated_fields[field_name] = new_val
            
            correction = ExtractedFieldCorrection(
                invoice_id=invoice_id,
                extraction_id=extraction.id,
                field_name=field_name,
                original_value=str(old_val) if old_val is not None else None,
                corrected_value=str(new_val),
                corrected_by=current_user.id
            )
            db.add(correction)
            corrections_made.append(field_name)

    if not corrections_made:
        return MessageResponse(message="No changes detected in fields")

    # Update extraction JSON
    # Note: SQLAlchemy JSON fields sometimes require assigning a new dict to trigger update
    extraction.extracted_fields = updated_fields

    # Log Audit
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="EDIT_FIELD",
        invoice_id=invoice_id,
        payload={"corrected_fields": corrections_made}
    )

    await db.commit()
    return MessageResponse(message=f"Successfully corrected {len(corrections_made)} field(s).")
