"""
schemas/schemas.py
==================
Pydantic request and response schemas for all API endpoints.
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Auth ─────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(OrmBase):
    id: uuid.UUID
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class MeResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"


# ── Vendors ──────────────────────────────────────────────────────────────────

class VendorResponse(OrmBase):
    id: uuid.UUID
    name: str
    tax_id: str | None
    is_approved: bool
    risk_level: str


# ── Invoices ─────────────────────────────────────────────────────────────────

class LineItemSchema(OrmBase):
    line_number: int
    description: str | None
    hsn_sac_code: str | None
    item_code: str | None
    quantity: Decimal | None
    unit: str | None
    unit_price: Decimal | None
    discount: Decimal | None
    tax_rate: Decimal | None
    line_total: Decimal | None


class RiskAssessmentResponse(OrmBase):
    id: uuid.UUID
    overall_risk: str
    risk_score: Decimal | None
    ai_summary: str | None
    recommendation: str | None
    flags: list[str] | None
    assessed_at: datetime


class OcrExtractionResponse(OrmBase):
    id: uuid.UUID
    extracted_fields: dict[str, Any]
    confidence_score: Decimal | None
    model_used: str | None
    status: str
    extracted_at: datetime


class InvoiceListItem(OrmBase):
    id: uuid.UUID
    system_reference: str
    status: str
    vendor_invoice_number: str | None
    total_amount: Decimal | None
    currency: str | None
    file_name: str
    created_at: datetime
    updated_at: datetime

    vendor_name: str | None = None
    risk_level: str | None = None


class InvoiceDetailResponse(OrmBase):
    id: uuid.UUID
    system_reference: str
    status: str
    vendor_id: uuid.UUID | None
    vendor_name_raw: str | None
    vendor_invoice_number: str | None
    invoice_date: date | None
    due_date: date | None
    payment_terms: str | None
    currency: str | None
    delivery_date: date | None
    po_number: str | None
    contract_reference: str | None
    project_code: str | None
    subtotal: Decimal | None
    discount_amount: Decimal | None
    shipping_amount: Decimal | None
    tax_rate: Decimal | None
    tax_amount: Decimal | None
    total_amount: Decimal | None
    amount_paid: Decimal | None
    balance_due: Decimal | None
    invoice_notes: str | None
    file_path: str
    file_name: str
    file_type: str | None
    uploaded_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    vendor: VendorResponse | None = None
    extraction: OcrExtractionResponse | None = None
    risk_assessment: RiskAssessmentResponse | None = None
    line_items: list[LineItemSchema] = []


class InvoicePaginatedResponse(BaseModel):
    items: list[InvoiceListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Field Corrections ────────────────────────────────────────────────────────

class FieldCorrectionRequest(BaseModel):
    fields: dict[str, Any]


class FieldCorrectionResponse(OrmBase):
    id: uuid.UUID
    invoice_id: uuid.UUID
    field_name: str
    original_value: str | None
    corrected_value: str
    corrected_at: datetime




class DecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED, REJECTED, or ON_HOLD")
    reason: str | None = None
    override_reason: str | None = None
    expected_resolution: date | None = None


class DecisionResponse(OrmBase):
    id: uuid.UUID
    invoice_id: uuid.UUID
    decision: str
    decided_at: datetime
    reason: str | None
    override_reason: str | None


# ── Comments ─────────────────────────────────────────────────────────────────

class CommentRequest(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
    is_internal: bool = True


class CommentResponse(OrmBase):
    id: uuid.UUID
    invoice_id: uuid.UUID
    comment: str
    is_internal: bool
    created_at: datetime
    user_name: str | None = None


# ── Admin ────────────────────────────────────────────────────────────────────

class UserUpdateRequest(BaseModel):
    role: str | None = None
    is_active: bool | None = None


class DashboardStats(BaseModel):
    total_invoices: int
    pending_review: int
    auto_approved: int
    high_risk: int
    approval_rate: float
    avg_processing_time_seconds: float | None


class RiskRuleResponse(OrmBase):
    id: uuid.UUID
    rule_code: str
    name: str
    description: str | None
    severity: str
    threshold: Decimal | None
    is_active: bool


class RiskRuleUpdateRequest(BaseModel):
    is_active: bool | None = None
    threshold: float | None = None


# ── Generic ──────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
