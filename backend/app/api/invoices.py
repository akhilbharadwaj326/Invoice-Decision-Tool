"""
api/invoices.py
===============
Invoice endpoints: list, get detail, upload, archive.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query, Request
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.deps import CurrentUser, require_reviewer
from app.core.config import get_settings
from app.models.models import Invoice, InvoiceSequence, Vendor, User
from app.schemas.schemas import InvoicePaginatedResponse, InvoiceDetailResponse, MessageResponse
from app.services.storage_service import upload_file, get_file_url
from app.services.audit_service import log_audit
from app.services.ocr_service import process_invoice_ocr

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])
settings = get_settings()


async def generate_system_reference(db: AsyncSession) -> str:
    """Generate IDT-YYYY-MM-NNNNNN sequence."""
    now = datetime.utcnow()
    year_month = now.strftime("%Y-%m")
    
    # Get and lock sequence row
    result = await db.execute(
        select(InvoiceSequence).where(InvoiceSequence.year_month == year_month).with_for_update()
    )
    seq = result.scalar_one_or_none()
    
    if seq:
        seq.last_seq += 1
    else:
        seq = InvoiceSequence(year_month=year_month, last_seq=1)
        db.add(seq)
        
    await db.flush()
    return f"IDT-{year_month}-{seq.last_seq:06d}"


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_invoice(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(require_reviewer()),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload an invoice (PDF/Image).
    Saves file to Supabase (or local fallback), creates Invoice record with status PROCESSING.
    """
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPG, PNG, WEBP are allowed.")

    # We read size locally to validate MAX_FILE_SIZE_MB if we wanted, but let's assume it's fine for now
    invoice_id = uuid.uuid4()
    
    # 1. Upload File
    file_path = await upload_file(file, invoice_id)
    
    # 2. Generate System Reference
    sys_ref = await generate_system_reference(db)
    
    # 3. Create Invoice Record
    invoice = Invoice(
        id=invoice_id,
        system_reference=sys_ref,
        status="PROCESSING",
        file_path=file_path,
        file_name=file.filename or "unknown",
        file_type=file.filename.split('.')[-1].lower() if file.filename and '.' in file.filename else None,
        uploaded_by=current_user.id
    )
    db.add(invoice)

    # 4. Audit Log
    await log_audit(db, "UPLOAD", user_id=current_user.id, invoice_id=invoice_id, request=request)

    await db.commit()
    await db.refresh(invoice)

    # Phase 5: Trigger OCR processing in background
    background_tasks.add_task(process_invoice_ocr, invoice.id, AsyncSessionLocal)
    
    return {"invoice_id": invoice.id, "system_reference": invoice.system_reference, "status": invoice.status}


@router.get("", response_model=InvoicePaginatedResponse)
async def list_invoices(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by vendor name, reference, or invoice number"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """List invoices with pagination, optional status filter, and text search."""
    from sqlalchemy import or_
    query = select(Invoice).options(selectinload(Invoice.vendor), selectinload(Invoice.risk_assessment))
    
    if status:
        query = query.where(Invoice.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Invoice.system_reference.ilike(search_term),
                Invoice.vendor_name_raw.ilike(search_term),
                Invoice.vendor_invoice_number.ilike(search_term),
            )
        )
        
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Pagination
    query = query.order_by(desc(Invoice.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    items = []
    for inv in invoices:
        items.append({
            "id": inv.id,
            "system_reference": inv.system_reference,
            "status": inv.status,
            "vendor_invoice_number": inv.vendor_invoice_number,
            "total_amount": inv.total_amount,
            "currency": inv.currency,
            "file_name": inv.file_name,
            "created_at": inv.created_at,
            "updated_at": inv.updated_at,
            "vendor_name": inv.vendor.name if inv.vendor else inv.vendor_name_raw,
            "risk_level": inv.risk_assessment.overall_risk if inv.risk_assessment else None
        })
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice_detail(
    invoice_id: uuid.UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """Get full details of a specific invoice including extraction and risk data."""
    query = (
        select(Invoice)
        .options(
            selectinload(Invoice.vendor),
            selectinload(Invoice.extraction),
            selectinload(Invoice.risk_assessment),
            selectinload(Invoice.line_items)
        )
        .where(Invoice.id == invoice_id)
    )
    result = await db.execute(query)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Build response using Pydantic schema (avoids _sa_instance_state serialization issues)
    response = InvoiceDetailResponse.model_validate(invoice)
    # Override file_path with signed URL (or local path)
    signed_url = await get_file_url(invoice.file_path)
    response = response.model_copy(update={"file_path": signed_url})

    return response


@router.patch("/{invoice_id}/archive", response_model=MessageResponse)
async def archive_invoice(
    invoice_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(require_reviewer()),
    db: AsyncSession = Depends(get_db)
):
    """Archive an invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    invoice.status = "ARCHIVED"
    await log_audit(db, "ARCHIVE", user_id=current_user.id, invoice_id=invoice_id, request=request)
    
    await db.commit()
    return {"message": "Invoice archived successfully"}
