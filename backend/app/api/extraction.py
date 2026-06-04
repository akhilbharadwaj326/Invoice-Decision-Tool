from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from decimal import Decimal, InvalidOperation

from app.core.database import get_db
from app.core.deps import CurrentUser, require_reviewer
from app.models.models import Invoice, OcrExtraction, ExtractedFieldCorrection, User
from app.schemas.schemas import FieldCorrectionRequest, MessageResponse
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/invoices", tags=["Extraction Corrections"])


# Map of accepted field names → Invoice column attributes
INVOICE_DIRECT_FIELDS = {
    "vendor_invoice_number": "vendor_invoice_number",
    "vendor_name_raw": "vendor_name_raw",
    "invoice_date": "invoice_date",
    "due_date": "due_date",
    "total_amount": "total_amount",
    "subtotal": "subtotal",
    "tax_amount": "tax_amount",
    "currency": "currency",
    "payment_terms": "payment_terms",
    "po_number": "po_number",
}


@router.patch("/{invoice_id}/fields", response_model=MessageResponse)
async def correct_extracted_fields(
    invoice_id: uuid.UUID,
    payload: FieldCorrectionRequest,
    current_user: User = Depends(require_reviewer()),
    db: AsyncSession = Depends(get_db),
):
    """
    Correct extracted fields for an invoice.
    Updates both Invoice columns directly and the OCR extraction JSON (if it exists).
    Logs each change into extracted_field_corrections.
    Requires REVIEWER or ADMIN role.
    """
    # 1. Verify invoice exists and is editable
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status in ["APPROVED", "REJECTED", "ARCHIVED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit fields for invoice in {invoice.status} status",
        )

    # 2. Fetch OCR Extraction (optional — may not exist for early-stage invoices)
    ext_result = await db.execute(
        select(OcrExtraction).where(OcrExtraction.invoice_id == invoice_id)
    )
    extraction = ext_result.scalar_one_or_none()

    current_fields = extraction.extracted_fields if extraction else {}
    updated_fields = dict(current_fields)
    corrections_made = []

    for field_name, new_val in payload.fields.items():
        old_val = current_fields.get(field_name)
        str_old = str(old_val) if old_val is not None else None
        str_new = str(new_val)

        # Apply to Invoice columns directly when field matches a known column
        if field_name in INVOICE_DIRECT_FIELDS:
            attr = INVOICE_DIRECT_FIELDS[field_name]
            # Coerce total_amount / subtotal / tax_amount to Decimal
            if attr in ("total_amount", "subtotal", "tax_amount"):
                try:
                    new_val = Decimal(str(new_val))
                except InvalidOperation:
                    continue
            old_invoice_val = getattr(invoice, attr, None)
            if str(old_invoice_val) != str_new:
                setattr(invoice, attr, new_val)

        # Track change for audit / extraction JSON update
        if str_old != str_new:
            updated_fields[field_name] = new_val
            correction = ExtractedFieldCorrection(
                invoice_id=invoice_id,
                extraction_id=extraction.id if extraction else None,
                field_name=field_name,
                original_value=str_old,
                corrected_value=str_new,
                corrected_by=current_user.id,
            )
            db.add(correction)
            corrections_made.append(field_name)

    if not corrections_made:
        return MessageResponse(message="No changes detected in fields")

    # Update extraction JSON if extraction exists
    if extraction:
        extraction.extracted_fields = updated_fields

    await log_audit(
        db=db,
        user_id=current_user.id,
        action="EDIT_FIELD",
        invoice_id=invoice_id,
        payload={"corrected_fields": corrections_made},
    )

    await db.commit()
    return MessageResponse(message=f"Successfully corrected {len(corrections_made)} field(s).")
