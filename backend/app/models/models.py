"""
models/models.py
================
SQLAlchemy ORM models mirroring the exact schema in database/init.sql.
Contains all 13 tables and their relationships.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    Boolean, Column, DateTime, DECIMAL, ForeignKey,
    Integer, String, Text, JSON, Date
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), default="REVIEWER", nullable=False, index=True)
    # VIEWER | REVIEWER | APPROVER | ADMIN
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    uploaded_invoices = relationship("Invoice", back_populates="uploader", foreign_keys="Invoice.uploaded_by")
    decisions = relationship("Decision", back_populates="decider")
    comments = relationship("InvoiceComment", back_populates="user")
    corrections = relationship("ExtractedFieldCorrection", back_populates="corrector")
    audit_logs = relationship("AuditLog", back_populates="user")
    reports = relationship("Report", back_populates="generator")


# ── Vendors ──────────────────────────────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    name_aliases = Column(ARRAY(Text))
    tax_id = Column(String(100), index=True)
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    bank_account = Column(String(100))
    bank_name = Column(String(100))
    ifsc_code = Column(String(20))
    is_approved = Column(Boolean, default=False, index=True)
    risk_level = Column(String(20), default="UNKNOWN")
    # UNKNOWN | LOW | MEDIUM | HIGH
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    invoices = relationship("Invoice", back_populates="vendor")


# ── Invoice Sequences ────────────────────────────────────────────────────────

class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"

    year_month = Column(String(7), primary_key=True)   # '2026-06'
    last_seq = Column(Integer, default=0)


# ── Invoices ─────────────────────────────────────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    system_reference = Column(String(25), unique=True, nullable=False, index=True)
    status = Column(String(30), default="PENDING", nullable=False, index=True)

    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), index=True)
    vendor_name_raw = Column(String(255))

    vendor_invoice_number = Column(String(100), index=True)
    invoice_date = Column(Date)
    due_date = Column(Date, index=True)
    payment_terms = Column(String(100))
    currency = Column(String(5), default="INR")
    delivery_date = Column(Date)

    po_number = Column(String(100))
    contract_reference = Column(String(100))
    project_code = Column(String(100))

    subtotal = Column(DECIMAL(15, 2))
    discount_amount = Column(DECIMAL(15, 2), default=0)
    shipping_amount = Column(DECIMAL(15, 2), default=0)
    tax_rate = Column(DECIMAL(5, 2))
    tax_amount = Column(DECIMAL(15, 2))
    total_amount = Column(DECIMAL(15, 2), index=True)
    amount_paid = Column(DECIMAL(15, 2), default=0)
    balance_due = Column(DECIMAL(15, 2))

    invoice_notes = Column(Text)

    file_path = Column(Text, nullable=False)
    file_name = Column(Text, nullable=False)
    file_type = Column(String(10))

    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    vendor = relationship("Vendor", back_populates="invoices")
    uploader = relationship("User", back_populates="uploaded_invoices", foreign_keys=[uploaded_by])
    extraction = relationship("OcrExtraction", back_populates="invoice", uselist=False)
    line_items = relationship("InvoiceLineItem", back_populates="invoice")
    risk_assessment = relationship("RiskAssessment", back_populates="invoice", uselist=False)
    decisions = relationship("Decision", back_populates="invoice")
    comments = relationship("InvoiceComment", back_populates="invoice", order_by="InvoiceComment.created_at")
    corrections = relationship("ExtractedFieldCorrection", back_populates="invoice")
    audit_logs = relationship("AuditLog", back_populates="invoice")


# ── OCR Extractions ──────────────────────────────────────────────────────────

class OcrExtraction(Base):
    __tablename__ = "ocr_extractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    raw_text = Column(Text)
    raw_response = Column(JSON)
    extracted_fields = Column(JSON, nullable=False, default={})
    confidence_score = Column(DECIMAL(4, 3))
    model_used = Column(String(50), default="gpt-4o")
    tokens_used = Column(Integer)
    status = Column(String(20), default="PENDING", index=True)
    error_message = Column(Text)
    extracted_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    invoice = relationship("Invoice", back_populates="extraction")
    line_items = relationship("InvoiceLineItem", back_populates="extraction")
    corrections = relationship("ExtractedFieldCorrection", back_populates="extraction")


# ── Invoice Line Items ───────────────────────────────────────────────────────

class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    extraction_id = Column(UUID(as_uuid=True), ForeignKey("ocr_extractions.id", ondelete="SET NULL"))
    line_number = Column(Integer, nullable=False)
    description = Column(Text)
    hsn_sac_code = Column(String(20))
    item_code = Column(String(100))
    quantity = Column(DECIMAL(12, 3))
    unit = Column(String(50))
    unit_price = Column(DECIMAL(15, 4))
    discount = Column(DECIMAL(15, 2), default=0)
    tax_rate = Column(DECIMAL(5, 2))
    line_total = Column(DECIMAL(15, 2))
    created_at = Column(DateTime(timezone=True), default=utcnow)

    invoice = relationship("Invoice", back_populates="line_items")
    extraction = relationship("OcrExtraction", back_populates="line_items")


# ── Extracted Field Corrections ──────────────────────────────────────────────

class ExtractedFieldCorrection(Base):
    __tablename__ = "extracted_field_corrections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    extraction_id = Column(UUID(as_uuid=True), ForeignKey("ocr_extractions.id", ondelete="SET NULL"))
    field_name = Column(String(100), nullable=False)
    original_value = Column(Text)
    corrected_value = Column(Text, nullable=False)
    correction_note = Column(Text)
    corrected_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    corrected_at = Column(DateTime(timezone=True), default=utcnow)

    invoice = relationship("Invoice", back_populates="corrections")
    extraction = relationship("OcrExtraction", back_populates="corrections")
    corrector = relationship("User", back_populates="corrections")


# ── Risk Rules ───────────────────────────────────────────────────────────────

class RiskRule(Base):
    __tablename__ = "risk_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_code = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    severity = Column(String(20), nullable=False)
    threshold = Column(DECIMAL(15, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ── Risk Assessments ─────────────────────────────────────────────────────────

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    overall_risk = Column(String(20), nullable=False, index=True)
    risk_score = Column(DECIMAL(4, 1))
    ai_summary = Column(Text)
    recommendation = Column(String(20))
    flags = Column(JSON, default=[])
    assessed_at = Column(DateTime(timezone=True), default=utcnow)

    invoice = relationship("Invoice", back_populates="risk_assessment")


# ── Decisions ────────────────────────────────────────────────────────────────

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(20), nullable=False)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    decided_at = Column(DateTime(timezone=True), default=utcnow, index=True)
    reason = Column(Text)
    override_reason = Column(Text)
    expected_resolution = Column(Date)

    invoice = relationship("Invoice", back_populates="decisions")
    decider = relationship("User", back_populates="decisions")


# ── Invoice Comments ─────────────────────────────────────────────────────────

class InvoiceComment(Base):
    __tablename__ = "invoice_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    comment = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    invoice = relationship("Invoice", back_populates="comments")
    user = relationship("User", back_populates="comments")


# ── Audit Logs ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action = Column(String(100), nullable=False, index=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="SET NULL"), index=True)
    payload = Column(JSON)
    ip_address = Column(INET)
    created_at = Column(DateTime(timezone=True), default=utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")
    invoice = relationship("Invoice", back_populates="audit_logs")


# ── Reports ──────────────────────────────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False)
    filters = Column(JSON)
    file_path = Column(Text)
    format = Column(String(10), default="CSV")
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    generator = relationship("User", back_populates="reports")
