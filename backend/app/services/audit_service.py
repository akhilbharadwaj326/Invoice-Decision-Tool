"""
services/audit_service.py
=========================
Helper function to log immutable audit trail events.
"""

import uuid
from typing import Any
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AuditLog


async def log_audit(
    db: AsyncSession,
    action: str,
    user_id: uuid.UUID | None = None,
    invoice_id: uuid.UUID | None = None,
    payload: dict[str, Any] | None = None,
    request: Request | None = None,
):
    """
    Records an action in the audit_logs table.
    """
    ip_address = None
    if request and request.client:
        ip_address = request.client.host

    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        invoice_id=invoice_id,
        payload=payload or {},
        ip_address=ip_address,
    )
    
    db.add(audit_entry)
    # We do NOT commit here, we let the caller commit the transaction
    # so that the audit log is part of the same transaction as the main action.
