import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.models.models import Invoice, RiskAssessment
from app.schemas.schemas import DashboardStats
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """
    Get high-level statistics for the dashboard.
    """
    # 1. Total invoices
    total_result = await db.execute(select(func.count(Invoice.id)))
    total_invoices = total_result.scalar() or 0

    # 2. Pending review
    pending_result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status.in_(["PENDING", "UNDER_REVIEW"]))
    )
    pending_review = pending_result.scalar() or 0

    # 3. Auto approved
    auto_approved_result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status == "APPROVED")
    )
    auto_approved = auto_approved_result.scalar() or 0

    # 4. High risk
    high_risk_result = await db.execute(
        select(func.count(RiskAssessment.id)).where(RiskAssessment.overall_risk == "HIGH")
    )
    high_risk = high_risk_result.scalar() or 0

    # 5. Approval rate
    approval_rate = 0.0
    if total_invoices > 0:
        approval_rate = (auto_approved / total_invoices) * 100.0

    # 6. Avg processing time (optional, returning None for now unless we calculate it)
    
    return DashboardStats(
        total_invoices=total_invoices,
        pending_review=pending_review,
        auto_approved=auto_approved,
        high_risk=high_risk,
        approval_rate=round(approval_rate, 2),
        avg_processing_time_seconds=None
    )


@router.get("/export")
async def export_invoices_csv(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db)
):
    """
    Export all invoices as a CSV file.
    """
    result = await db.execute(
        select(Invoice, RiskAssessment)
        .outerjoin(RiskAssessment, Invoice.id == RiskAssessment.invoice_id)
        .order_by(Invoice.created_at.desc())
    )
    rows = result.all()
    
    # Create an in-memory string buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Invoice ID", "System Reference", "Status", "Vendor Name", 
        "Total Amount", "Currency", "Upload Date", "Risk Level", "Risk Score"
    ])
    
    # Write rows
    for invoice, risk in rows:
        writer.writerow([
            str(invoice.id),
            invoice.system_reference,
            invoice.status,
            invoice.vendor_name_raw or "Unknown",
            str(invoice.total_amount) if invoice.total_amount else "0",
            invoice.currency,
            invoice.created_at.isoformat() if invoice.created_at else "",
            risk.overall_risk if risk else "UNKNOWN",
            str(risk.risk_score) if risk and risk.risk_score else "0"
        ])
        
    await log_audit(
        db=db,
        user_id=current_user.id,
        action="EXPORT_REPORT",
        payload={"format": "CSV"}
    )
    await db.commit()

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices_export.csv"}
    )
