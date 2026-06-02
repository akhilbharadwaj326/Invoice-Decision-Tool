# 🏗️ System Architecture Document (SAD)
## Invoice Decision Tool
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft  
**Document Owner:** Engineering Lead  
**Repository:** [Invoice-Decision-Tool](https://github.com/akhilbharadwaj326/Invoice-Decision-Tool)

---

## Table of Contents
1. [Document Purpose](#1-document-purpose)
2. [Architecture Principles](#2-architecture-principles)
3. [High-Level System Architecture](#3-high-level-system-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Integration Architecture](#8-integration-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Performance Design](#11-performance-design)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Architecture Decision Records (ADRs)](#13-architecture-decision-records-adrs)

---

## 1. Document Purpose

This document describes the technical architecture of the Invoice Decision Tool. It defines:
- How system components are structured and interact
- Technology choices and their rationale
- Data flow through the system
- Security and deployment design
- Key architectural decisions

**Audience:** Engineering team, technical leads, DevOps, security reviewers.

---

## 2. Architecture Principles

| Principle | Description |
|---|---|
| **Simplicity First** | Prefer simple, well-understood patterns over clever abstractions |
| **Open Source Only** | All components must be free/open-source or use existing paid accounts (OpenAI) |
| **Async by Default** | Long-running operations (OCR, AI) must be non-blocking |
| **Security in Layers** | Auth at API gateway, role checks at endpoint, ownership checks at service |
| **Audit Everything** | Every data-mutating operation writes to audit_logs |
| **Fail Gracefully** | AI/OCR failures must not break the core invoice workflow |
| **Schema First** | API contracts (Pydantic) and DB schema (SQLAlchemy) defined before implementation |

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REPLIT HOSTING                                │
│                                                                         │
│   ┌──────────────────────────┐       ┌──────────────────────────────┐  │
│   │    React Frontend        │       │    FastAPI Backend             │  │
│   │    Static Deployment     │◀─────▶│    Reserved VM               │  │
│   │    (Free)                │  REST │    0.5 vCPU / 512MB RAM      │  │
│   │                          │  API  │    Python 3.12 + Uvicorn     │  │
│   │  Vite + React 18         │       │    Async Background Tasks    │  │
│   │  Tailwind + Shadcn/UI    │       │                              │  │
│   │  Redux Toolkit           │       │  ┌────────────────────────┐  │  │
│   └──────────────────────────┘       │  │  Services Layer         │  │  │
│                                      │  │  ├── Auth Service       │  │  │
│                                      │  │  ├── Invoice Service    │  │  │
│                                      │  │  ├── OCR/AI Service     │  │  │
│                                      │  │  ├── Risk Engine        │  │  │
│                                      │  │  ├── Decision Service   │  │  │
│                                      │  │  └── Report Service     │  │  │
│                                      │  └────────────────────────┘  │  │
│                                      └──────────────┬───────────────┘  │
└─────────────────────────────────────────────────────┼───────────────────┘
                                                       │
              ┌────────────────────┬──────────────────┬┴──────────────────┐
              │                    │                   │                    │
              ▼                    ▼                   ▼                    ▼
   ┌─────────────────┐  ┌──────────────────┐ ┌──────────────┐  ┌─────────────────┐
   │  Neon.tech      │  │  OpenAI API      │ │  Supabase    │  │  (Future)        │
   │  PostgreSQL 16  │  │  GPT-4o Vision   │ │  Storage     │  │  Email / ERP     │
   │  + pgvector     │  │  (OCR + AI)      │ │  (Files)     │  │  Integrations    │
   └─────────────────┘  └──────────────────┘ └──────────────┘  └─────────────────┘
```

### Request Flow Types

| Flow | Synchronous | Asynchronous |
|---|---|---|
| Login / Auth | ✅ | — |
| Invoice list / detail | ✅ | — |
| Invoice upload | ✅ (save file) | 🔄 (OCR processing) |
| GPT-4o extraction | — | ✅ (BackgroundTask) |
| Risk assessment | — | ✅ (BackgroundTask) |
| Report generation | ✅ (small) | 🔄 (large datasets) |
| Approve / Reject / Comment | ✅ | — |

---

## 4. Component Architecture

```
Invoice Decision Tool
│
├── Frontend (React SPA)
│   ├── Auth Module          → Login, Signup, token management
│   ├── Invoice Module       → Upload, List, Detail, Review
│   ├── Decision Module      → Approve, Reject, On Hold
│   ├── Comments Module      → Thread, Add, Edit
│   ├── Reports Module       → Generate, Download
│   └── Admin Module         → Users, Rules, Audit, Dashboard
│
├── Backend (FastAPI)
│   ├── API Layer            → Route handlers, request validation
│   ├── Service Layer        → Business logic, orchestration
│   │   ├── Auth Service     → JWT, password, session
│   │   ├── Invoice Service  → CRUD, status management
│   │   ├── OCR/AI Service   → GPT-4o Vision, field parsing
│   │   ├── Risk Engine      → Rule evaluation, scoring
│   │   ├── Decision Service → Approve/Reject/Hold logic
│   │   ├── Report Service   → CSV generation
│   │   └── Audit Service    → Log every mutation
│   ├── Data Layer           → SQLAlchemy ORM, Alembic migrations
│   └── Background Tasks     → Async OCR + risk processing
│
└── External Services
    ├── Neon PostgreSQL       → Primary data store
    ├── Supabase Storage      → Invoice file storage
    └── OpenAI API            → GPT-4o Vision extraction
```

---

## 5. Frontend Architecture

### 5.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | Shadcn/UI + Radix UI | Latest |
| State (global) | Redux Toolkit | 2.x |
| API Layer | RTK Query | 2.x |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Routing | React Router | 6.x |
| Charts | Recharts | 2.x |
| Icons | Lucide React | Latest |
| Tables | TanStack Table | 8.x |

### 5.2 Application Structure

```
frontend/src/
├── app/
│   ├── store.ts              → Redux store configuration
│   └── router.tsx            → Route definitions + guards
│
├── features/
│   ├── auth/
│   │   ├── authSlice.ts      → User state, token management
│   │   ├── authApi.ts        → RTK Query: login, signup, me
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── invoices/
│   │   ├── invoiceApi.ts     → RTK Query: CRUD, upload, extract
│   │   ├── invoiceSlice.ts   → Filter/pagination state
│   │   ├── InvoiceListPage.tsx
│   │   ├── InvoiceUploadPage.tsx
│   │   ├── InvoiceDetailPage.tsx
│   │   └── components/
│   │       ├── InvoiceTable.tsx
│   │       ├── InvoiceStatusBadge.tsx
│   │       ├── RiskBadge.tsx
│   │       ├── ExtractedFieldCard.tsx
│   │       ├── FieldEditor.tsx          → Inline edit field
│   │       ├── RiskFlagsPanel.tsx
│   │       ├── AISummaryCard.tsx
│   │       └── InvoiceFileViewer.tsx    → PDF/image viewer
│   │
│   ├── decisions/
│   │   ├── decisionApi.ts
│   │   ├── ApproveRejectPanel.tsx
│   │   ├── OnHoldModal.tsx
│   │   └── DecisionHistory.tsx
│   │
│   ├── comments/
│   │   ├── commentApi.ts
│   │   └── CommentThread.tsx
│   │
│   ├── reports/
│   │   ├── reportApi.ts
│   │   └── ReportsPage.tsx
│   │
│   └── admin/
│       ├── adminApi.ts
│       ├── AdminDashboard.tsx
│       ├── UserManagement.tsx
│       └── AuditTrail.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx      → Sidebar + topbar wrapper
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── ui/                   → Shadcn/UI base components
│
└── lib/
    ├── constants.ts          → Status, role, risk enums
    ├── utils.ts              → Formatters, helpers
    └── types.ts              → Shared TypeScript types
```

### 5.3 State Management Pattern

```
┌─────────────────────────────────────────────────┐
│                  Redux Store                     │
│                                                  │
│  authSlice          → currentUser, token         │
│  invoiceSlice       → filters, pagination        │
│                                                  │
│  RTK Query API Cache (auto-managed):             │
│  invoiceApi         → invoice CRUD               │
│  authApi            → login/signup               │
│  adminApi           → users, rules, stats        │
│  reportApi          → generate, download         │
└─────────────────────────────────────────────────┘
```

### 5.4 Route Structure & Guards

```typescript
// Role-based route guards
<Route path="/login" element={<PublicRoute />}>
<Route path="/signup" element={<PublicRoute />}>
<Route element={<ProtectedRoute roles={["VIEWER","REVIEWER","APPROVER","ADMIN"]} />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/invoices" element={<InvoiceListPage />} />
  <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</Route>
<Route element={<ProtectedRoute roles={["REVIEWER","APPROVER","ADMIN"]} />}>
  <Route path="/invoices/upload" element={<InvoiceUploadPage />} />
</Route>
<Route element={<ProtectedRoute roles={["ADMIN"]} />}>
  <Route path="/admin/*" element={<AdminRoutes />} />
</Route>
```

---

## 6. Backend Architecture

### 6.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Python | 3.12 |
| Framework | FastAPI | 0.111+ |
| ASGI Server | Uvicorn | 0.30+ |
| ORM | SQLAlchemy (async) | 2.x |
| Migrations | Alembic | 1.x |
| Validation | Pydantic v2 | 2.x |
| Auth | python-jose + passlib | Latest |
| HTTP Client | httpx | 0.27+ |
| AI SDK | openai | 1.x |
| PDF Processing | pdf2image + Pillow | Latest |
| CSV | Python stdlib csv | Built-in |

### 6.2 Backend Structure

```
backend/
├── app/
│   ├── main.py               → FastAPI app init, middleware, router mount
│   │
│   ├── core/
│   │   ├── config.py         → Settings (env vars via pydantic-settings)
│   │   ├── security.py       → JWT encode/decode, password hash
│   │   ├── deps.py           → Dependency injection: get_db, get_current_user
│   │   └── database.py       → Async SQLAlchemy engine + session
│   │
│   ├── api/
│   │   ├── auth.py           → /auth/* routes
│   │   ├── invoices.py       → /invoices/* routes
│   │   ├── extraction.py     → /invoices/{id}/extraction routes
│   │   ├── decisions.py      → /invoices/{id}/approve|reject|hold
│   │   ├── comments.py       → /invoices/{id}/comments
│   │   ├── reports.py        → /reports/*
│   │   └── admin.py          → /admin/*
│   │
│   ├── models/               → SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── vendor.py
│   │   ├── invoice.py
│   │   ├── ocr_extraction.py
│   │   ├── line_item.py
│   │   ├── risk_assessment.py
│   │   ├── decision.py
│   │   ├── comment.py
│   │   ├── audit_log.py
│   │   └── risk_rule.py
│   │
│   ├── schemas/              → Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── invoice.py
│   │   ├── extraction.py
│   │   ├── decision.py
│   │   ├── comment.py
│   │   └── report.py
│   │
│   └── services/
│       ├── auth_service.py         → Login, token generation
│       ├── invoice_service.py      → Invoice CRUD, status transitions
│       ├── storage_service.py      → Supabase file upload/download
│       ├── ocr_service.py          → GPT-4o Vision call + response parsing
│       ├── risk_engine.py          → Rule evaluation, scoring
│       ├── vendor_matcher.py       → Fuzzy match vendor name → vendor_id
│       ├── decision_service.py     → Approve/Reject/Hold logic
│       ├── audit_service.py        → Write audit log entries
│       └── report_service.py       → CSV generation
│
├── alembic/                  → Database migrations
│   └── versions/
│
├── tests/
│   ├── test_auth.py
│   ├── test_invoices.py
│   └── test_risk_engine.py
│
├── requirements.txt
└── .env
```

### 6.3 Request Lifecycle

```
HTTP Request
     ↓
FastAPI Router → Pydantic Validation (auto)
     ↓
JWT Middleware → Decode token → get_current_user
     ↓
Role Dependency → Check role permission
     ↓
Route Handler → Call Service(s)
     ↓
Service Layer → Business logic
     ↓
SQLAlchemy → Async DB query (Neon PostgreSQL)
     ↓
Audit Service → Write audit log (on mutations)
     ↓
Pydantic Response Schema → Serialize
     ↓
HTTP Response (JSON)
```

### 6.4 Async Invoice Processing Flow

```python
# Route handler (returns immediately)
@router.post("/invoices/upload")
async def upload_invoice(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    # 1. Save file to Supabase (sync, fast)
    file_url = await storage_service.upload(file)

    # 2. Create invoice record (PENDING)
    invoice = await invoice_service.create(file_url, current_user)

    # 3. Trigger background processing (non-blocking)
    background_tasks.add_task(
        process_invoice_async, invoice.id
    )

    # 4. Return immediately — client polls for status
    return {"id": invoice.id, "status": "PENDING"}


# Background task (runs after response is sent)
async def process_invoice_async(invoice_id: UUID):
    # Step 1: Update status → PROCESSING
    await invoice_service.update_status(invoice_id, "PROCESSING")

    # Step 2: GPT-4o Vision extraction
    extracted = await ocr_service.extract(invoice_id)

    # Step 3: Vendor matching
    vendor_id = await vendor_matcher.match(extracted.vendor_name)

    # Step 4: Risk rules evaluation
    risk = await risk_engine.evaluate(invoice_id, extracted)

    # Step 5: Update status → EXTRACTED
    await invoice_service.update_status(invoice_id, "EXTRACTED")
```

---

## 7. Data Architecture

### 7.1 Invoice Status State Machine

```
                    ┌─────────┐
                    │ PENDING │ ← Invoice uploaded, file saved
                    └────┬────┘
                         │ Background task starts
                    ┌────▼────────┐
                    │ PROCESSING  │ ← GPT-4o running
                    └────┬────────┘
              ┌──────────┴──────────┐
         ✅ Success             ❌ Failure
              │                     │
       ┌──────▼──────┐      ┌───────▼──────┐
       │  EXTRACTED  │      │    FAILED    │ ← Re-process available
       └──────┬──────┘      └──────────────┘
              │ Reviewer opens invoice
       ┌──────▼──────────┐
       │  UNDER_REVIEW   │ ← Reviewer editing/checking
       └──────┬──────────┘
    ┌─────────┼──────────────┐
    │         │              │
┌───▼────┐ ┌──▼─────┐ ┌─────▼────┐
│APPROVED│ │REJECTED│ │ ON_HOLD  │ ← Pending more info
└───┬────┘ └──┬─────┘ └────┬─────┘
    │         │             │ Issue resolved
    │         │             └──────→ UNDER_REVIEW
    └────┬────┘
    ┌────▼────┐
    │ARCHIVED │ ← Read-only, permanent record
    └─────────┘
```

### 7.2 Complete Database Schema

```sql
-- ════════════════════════════════════
-- USERS
-- ════════════════════════════════════
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'REVIEWER',
    -- VIEWER | REVIEWER | APPROVER | ADMIN
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- VENDORS
-- ════════════════════════════════════
CREATE TABLE vendors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    name_aliases  TEXT[],          -- Alternative names for fuzzy matching
    tax_id        VARCHAR(100),
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       TEXT,
    bank_account  VARCHAR(100),
    bank_name     VARCHAR(100),
    ifsc_code     VARCHAR(20),
    is_approved   BOOLEAN DEFAULT FALSE,
    risk_level    VARCHAR(20) DEFAULT 'UNKNOWN',
    -- UNKNOWN | LOW | MEDIUM | HIGH
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- INVOICE SEQUENCES (for system reference)
-- ════════════════════════════════════
CREATE TABLE invoice_sequences (
    year_month    CHAR(7) PRIMARY KEY,  -- '2026-06'
    last_seq      INTEGER DEFAULT 0
);

-- ════════════════════════════════════
-- INVOICES (Core table)
-- ════════════════════════════════════
CREATE TABLE invoices (
    -- Identity
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_reference       VARCHAR(25) UNIQUE NOT NULL, -- IDT-2026-06-000001
    status                 VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    -- Vendor
    vendor_id              UUID REFERENCES vendors(id),       -- Matched vendor
    vendor_name_raw        VARCHAR(255),                      -- As extracted by OCR

    -- Invoice Header
    vendor_invoice_number  VARCHAR(100),
    invoice_date           DATE,
    due_date               DATE,
    payment_terms          VARCHAR(100),
    currency               VARCHAR(5) DEFAULT 'USD',
    delivery_date          DATE,

    -- References
    po_number              VARCHAR(100),
    contract_reference     VARCHAR(100),
    project_code           VARCHAR(100),

    -- Financial Summary
    subtotal               DECIMAL(15,2),
    discount_amount        DECIMAL(15,2) DEFAULT 0,
    shipping_amount        DECIMAL(15,2) DEFAULT 0,
    tax_rate               DECIMAL(5,2),
    tax_amount             DECIMAL(15,2),
    total_amount           DECIMAL(15,2) NOT NULL,
    amount_paid            DECIMAL(15,2) DEFAULT 0,
    balance_due            DECIMAL(15,2),

    -- Notes
    invoice_notes          TEXT,

    -- File
    file_path              TEXT NOT NULL,     -- Supabase Storage URL
    file_name              TEXT NOT NULL,
    file_type              VARCHAR(10),       -- pdf | jpg | png | webp

    -- Metadata
    uploaded_by            UUID REFERENCES users(id),
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_uploaded_by ON invoices(uploaded_by);
CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_total_amount ON invoices(total_amount);
CREATE INDEX idx_invoices_invoice_number ON invoices(vendor_invoice_number);

-- ════════════════════════════════════
-- OCR EXTRACTIONS (AI Output — Separate Table)
-- ════════════════════════════════════
CREATE TABLE ocr_extractions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id       UUID UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    raw_text         TEXT,                -- Full text extracted
    raw_response     JSONB,               -- Complete API response
    extracted_fields JSONB NOT NULL,      -- Structured fields (see JSONB spec)
    confidence_score DECIMAL(4,3),        -- Overall: 0.000–1.000
    model_used       VARCHAR(50) DEFAULT 'gpt-4o',
    tokens_used      INTEGER,
    status           VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING | PROCESSING | COMPLETED | FAILED
    error_message    TEXT,
    extracted_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- INVOICE LINE ITEMS
-- ════════════════════════════════════
CREATE TABLE invoice_line_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id    UUID REFERENCES invoices(id) ON DELETE CASCADE,
    extraction_id UUID REFERENCES ocr_extractions(id),
    line_number   INTEGER NOT NULL,
    description   TEXT,
    hsn_sac_code  VARCHAR(20),      -- For GST compliance
    item_code     VARCHAR(100),
    quantity      DECIMAL(12,3),
    unit          VARCHAR(50),      -- pcs | hrs | kg | l | box
    unit_price    DECIMAL(15,4),
    discount      DECIMAL(15,2) DEFAULT 0,
    tax_rate      DECIMAL(5,2),
    line_total    DECIMAL(15,2),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- EXTRACTED FIELD CORRECTIONS (Edit History)
-- ════════════════════════════════════
CREATE TABLE extracted_field_corrections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES invoices(id),
    extraction_id   UUID REFERENCES ocr_extractions(id),
    field_name      VARCHAR(100) NOT NULL,
    original_value  TEXT,              -- AI-extracted value
    corrected_value TEXT NOT NULL,     -- User correction
    correction_note TEXT,
    corrected_by    UUID REFERENCES users(id),
    corrected_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- RISK RULES (Configurable)
-- ════════════════════════════════════
CREATE TABLE risk_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code   VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    severity    VARCHAR(20) NOT NULL,   -- LOW | MEDIUM | HIGH | CRITICAL
    threshold   DECIMAL(15,2),          -- For amount-based rules
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO risk_rules (rule_code, name, description, severity, threshold, is_active) VALUES
  ('DUPLICATE_INVOICE',    'Duplicate Invoice',         'Same vendor + invoice number within 12 months',     'CRITICAL', NULL,    TRUE),
  ('AMOUNT_HIGH',          'High Amount',               'Invoice total exceeds configured threshold',         'HIGH',     50000,   TRUE),
  ('UNKNOWN_VENDOR',       'Unknown Vendor',            'Vendor not in approved vendor list',                 'HIGH',     NULL,    TRUE),
  ('MISSING_PO',           'Missing PO Number',         'No PO number found on invoice',                     'MEDIUM',   NULL,    TRUE),
  ('OVERDUE_DUE_DATE',     'Overdue Invoice',           'Invoice due date is in the past',                    'MEDIUM',   NULL,    TRUE),
  ('CURRENCY_MISMATCH',    'Currency Mismatch',         'Non-standard currency detected',                     'HIGH',     NULL,    TRUE),
  ('LOW_CONFIDENCE',       'Low OCR Confidence',        'Overall extraction confidence below 70%',            'MEDIUM',   NULL,    TRUE),
  ('MISSING_VENDOR_TAX',   'Missing Vendor Tax ID',     'Vendor tax ID / GST number not present',            'MEDIUM',   NULL,    TRUE);

-- ════════════════════════════════════
-- RISK ASSESSMENTS
-- ════════════════════════════════════
CREATE TABLE risk_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID UNIQUE REFERENCES invoices(id) ON DELETE CASCADE,
    overall_risk    VARCHAR(20) NOT NULL,  -- LOW | MEDIUM | HIGH | CRITICAL
    risk_score      DECIMAL(4,1),          -- 0.0 – 10.0
    ai_summary      TEXT,                  -- Human-readable explanation
    recommendation  VARCHAR(20),           -- APPROVE | REVIEW | DECLINE
    flags           JSONB,                 -- [{rule_code, severity, description, flagged_value}]
    assessed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- DECISIONS (Approve / Reject / On Hold)
-- ════════════════════════════════════
CREATE TABLE decisions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES invoices(id),
    decision        VARCHAR(20) NOT NULL,  -- APPROVED | REJECTED | ON_HOLD
    decided_by      UUID REFERENCES users(id),
    decided_at      TIMESTAMPTZ DEFAULT NOW(),
    reason          TEXT,                  -- Required for REJECTED / ON_HOLD
    override_reason TEXT,                  -- If overriding AI recommendation
    expected_resolution DATE               -- For ON_HOLD decisions
);

-- ════════════════════════════════════
-- COMMENTS
-- ════════════════════════════════════
CREATE TABLE invoice_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID REFERENCES invoices(id),
    user_id     UUID REFERENCES users(id),
    comment     TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════
-- AUDIT LOGS
-- ════════════════════════════════════
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    -- UPLOAD | EXTRACT | REVIEW | EDIT_FIELD | APPROVE | REJECT
    -- ON_HOLD | COMMENT | ARCHIVE | EXPORT | LOGIN | LOGOUT
    invoice_id  UUID REFERENCES invoices(id),
    payload     JSONB,      -- { before: {...}, after: {...} }
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_invoice_id ON audit_logs(invoice_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 7.3 OCR `extracted_fields` JSONB Specification

```json
{
  "vendor": {
    "name": "Acme Corporation Ltd",
    "address": "123 Business Park, Mumbai 400001",
    "tax_id": "27AABCU9603R1ZX",
    "email": "billing@acme.com",
    "phone": "+91-9876543210",
    "bank_account": "1234567890",
    "bank_name": "HDFC Bank",
    "ifsc_code": "HDFC0001234",
    "swift_code": null
  },
  "buyer": {
    "name": "Your Company Pvt Ltd",
    "address": "456 Corporate Ave, Bangalore 560001",
    "tax_id": "29AABCY1234R1ZX",
    "contact": "Accounts Payable Team"
  },
  "invoice": {
    "number": "INV-2026-0099",
    "date": "2026-06-01",
    "due_date": "2026-07-01",
    "payment_terms": "Net 30",
    "po_number": "PO-2026-789",
    "contract_ref": "C-2026-10",
    "currency": "INR",
    "delivery_date": null
  },
  "financials": {
    "subtotal": 45000.00,
    "discount": 0.00,
    "tax_rate": 18.0,
    "tax_amount": 8100.00,
    "cgst": 4050.00,
    "sgst": 4050.00,
    "igst": null,
    "shipping": 500.00,
    "other_charges": 0.00,
    "total": 53600.00
  },
  "line_items": [
    {
      "line": 1,
      "description": "Software Development Services",
      "hsn_sac": "998314",
      "item_code": "SVC-001",
      "quantity": 40,
      "unit": "hrs",
      "unit_price": 1125.00,
      "discount": 0.00,
      "tax_rate": 18.0,
      "total": 45000.00
    }
  ],
  "field_confidence": {
    "vendor_name": 0.98,
    "invoice_number": 0.95,
    "amount": 0.97,
    "invoice_date": 0.92,
    "due_date": 0.88,
    "po_number": 0.75,
    "tax_id": 0.60
  },
  "notes": "Payment via NEFT only."
}
```

---

## 8. Integration Architecture

### 8.1 OpenAI GPT-4o Vision (OCR + Risk Analysis)

```
FastAPI Service → openai.chat.completions.create()
                  model="gpt-4o"
                  messages=[
                    system: "You are an invoice data extraction expert..."
                    user: [image_url, extraction_prompt]
                  ]
                  response_format={"type": "json_object"}
              ↓
          Parse JSON response → Validate with Pydantic
              ↓
          Store in ocr_extractions.extracted_fields (JSONB)
```

**Prompt Strategy:**
- System prompt: Define all fields to extract + output JSON schema
- User message: Invoice image + "Extract all fields as JSON"
- Temperature: 0 (deterministic extraction)
- Retry: Up to 2 retries on failure with exponential backoff

### 8.2 Supabase Storage (File Storage)

```
File Upload:
  client → POST /api/invoices/upload (multipart)
  FastAPI → supabase.storage.from_("invoices").upload(path, file)
  Returns: public_url stored in invoices.file_path

File Access:
  FastAPI → supabase.storage.from_("invoices").create_signed_url(path, 3600)
  Returns: signed URL valid for 1 hour (secure, authenticated access)
```

### 8.3 Neon PostgreSQL (Database)

```python
# Async connection via SQLAlchemy
DATABASE_URL = "postgresql+asyncpg://user:pass@neon.host/dbname"

engine = create_async_engine(DATABASE_URL, pool_size=5, max_overflow=10)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

# Per-request session via FastAPI dependency
async def get_db():
    async with AsyncSession() as session:
        yield session
```

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
Signup:
  POST /auth/signup
  → Validate email uniqueness
  → Hash password (bcrypt, cost=12)
  → Create user (role=REVIEWER)
  → Return access_token + set refresh_token cookie

Login:
  POST /auth/login
  → Verify email + bcrypt password
  → Issue JWT access_token (HS256, 30min)
  → Set httpOnly refresh_token cookie (7 days)
  → Return access_token + user info

Protected Request:
  Authorization: Bearer <access_token>
  → FastAPI dependency: decode JWT → get user
  → Role check dependency: verify role permission
  → Proceed or 403 Forbidden

Token Refresh:
  POST /auth/refresh (sends cookie automatically)
  → Validate refresh_token
  → Issue new access_token
  → Rotate refresh_token (new cookie)
```

### 9.2 Security Controls

| Control | Implementation |
|---|---|
| Password Storage | bcrypt (cost factor 12) via passlib |
| JWT Signing | HS256, 256-bit secret key from environment |
| Refresh Tokens | httpOnly + Secure + SameSite=Strict cookie |
| CORS | Whitelist exact frontend origin (not `*`) |
| File Validation | Server-side MIME type check + 20MB size limit |
| SQL Injection | SQLAlchemy ORM parameterized queries (no raw SQL) |
| Role Enforcement | Server-side dependency on every protected route |
| Rate Limiting | slowapi: 60/min on auth endpoints, 200/min overall |
| Sensitive Config | All secrets in environment variables, never in code |
| Audit Trail | Immutable log, no DELETE on audit_logs table |
| Supabase Access | Signed URLs (1-hour expiry) — no public bucket |

---

## 10. Deployment Architecture

### 10.1 Replit Deployment

```
┌─────────────────────────────────────────────┐
│              REPLIT PLATFORM                │
│                                             │
│  ┌──────────────────────────┐               │
│  │  Static Deployment       │               │
│  │  (React Build Output)    │               │
│  │  URL: invoice-app.repl.co│               │
│  │  Cost: FREE              │               │
│  └──────────────────────────┘               │
│                                             │
│  ┌──────────────────────────┐               │
│  │  Reserved VM             │               │
│  │  0.5 vCPU / 512MB RAM    │               │
│  │  Python 3.12 + Uvicorn   │               │
│  │  URL: invoice-api.repl.co│               │
│  │  Cost: ~$7.20/month      │               │
│  └──────────────────────────┘               │
└─────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────┐     ┌──────────────────┐
│  Neon.tech   │     │  Supabase        │
│  PostgreSQL  │     │  Storage         │
│  (Free tier) │     │  (Free tier)     │
└──────────────┘     └──────────────────┘
```

### 10.2 Environment Configuration

```bash
# Backend environment variables
DATABASE_URL=postgresql+asyncpg://user:pass@neon.tech:5432/invoicedb
SECRET_KEY=<256-bit-random-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

OPENAI_API_KEY=<your-openai-api-key>

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_BUCKET=invoices

FRONTEND_URL=https://invoice-app.repl.co
ENVIRONMENT=production

# Frontend environment variables
VITE_API_BASE_URL=https://invoice-api.repl.co
```

### 10.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on: [push to main]

jobs:
  backend-test:
    - Install Python deps
    - Run pytest
    - Check Ruff linting

  frontend-test:
    - Install Node deps
    - Run Vitest
    - Run ESLint
    - Build Vite (verify no build errors)

  deploy:
    needs: [backend-test, frontend-test]
    - Deploy backend to Replit (via Replit API or git push)
    - Deploy frontend to Replit Static
```

---

## 11. Performance Design

### 11.1 API Performance Targets

| Endpoint | Target P95 |
|---|---|
| GET /invoices (list) | < 300ms |
| GET /invoices/:id | < 200ms |
| POST /invoices/upload | < 2s (file save only) |
| GET /invoices/:id/extraction | < 150ms |
| POST /approve / reject | < 300ms |
| GET /admin/stats | < 500ms |

### 11.2 Optimization Strategies

| Strategy | Implementation |
|---|---|
| **Database Indexes** | On status, vendor_id, uploaded_by, created_at, amount |
| **Pagination** | All list endpoints paginated (default 20, max 100) |
| **Async OCR** | GPT-4o runs in background — never blocks API response |
| **Connection Pooling** | SQLAlchemy pool_size=5, max_overflow=10 |
| **Response Caching** | RTK Query client-side caching (60s for lists) |
| **File Type Filter** | Reject non-PDF/image before upload processing |
| **RAM Management** | No heavy in-memory libraries; GPT-4o handles OCR |

---

## 12. Error Handling Strategy

### 12.1 Backend Error Responses

```python
# Standard error response format
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",          # Machine-readable
  "field": "field_name"          # For validation errors
}

# HTTP Status Codes Used
400 Bad Request          → Validation error, invalid input
401 Unauthorized         → Missing or invalid JWT
403 Forbidden            → Valid JWT but insufficient role
404 Not Found            → Resource doesn't exist
409 Conflict             → Duplicate resource (email, invoice number)
422 Unprocessable Entity → Pydantic schema validation failure
500 Internal Server Error → Unexpected backend error
503 Service Unavailable   → OpenAI API down (with retry info)
```

### 12.2 OCR Failure Handling

```
GPT-4o Extraction Fails
         ↓
Retry 1 (after 2s) → Retry 2 (after 5s)
         ↓ (if all fail)
Invoice status → FAILED
Error message stored in ocr_extractions.error_message
Frontend shows: "Extraction failed — click to retry"
User can manually re-trigger via POST /invoices/{id}/reprocess
```

---

## 13. Architecture Decision Records (ADRs)

### ADR-01: Python FastAPI over Java Spring Boot
**Decision:** Use Python FastAPI  
**Rationale:** Native AI/ML library support (OpenAI SDK, LangChain), lighter Docker image, faster development, async-first. Spring Boot adds significant boilerplate with no meaningful advantage for this use case.  
**Trade-off:** Less suitable if team is Java-only or if high-volume batch processing is needed later.

### ADR-02: GPT-4o Vision over Tesseract/PaddleOCR
**Decision:** Use OpenAI GPT-4o Vision for OCR and data extraction  
**Rationale:** Single API call handles OCR + structured extraction + basic risk understanding. Eliminates need for heavy OCR libraries (saves ~300MB RAM on Replit VM). Higher accuracy on diverse invoice layouts.  
**Trade-off:** Costs per API call (~$0.01–0.03/invoice); requires internet connectivity.

### ADR-03: FastAPI BackgroundTasks over Celery/Redis
**Decision:** Use FastAPI's built-in `BackgroundTasks` for async processing  
**Rationale:** Celery requires a separate Redis broker — another service consuming limited Replit RAM. BackgroundTasks is sufficient for v1.0 volume (< 500 invoices/month).  
**Trade-off:** No persistent task queue — if server restarts mid-extraction, task is lost. Acceptable for MVP; upgrade to Celery + Redis in Phase 2 if needed.

### ADR-04: Neon.tech over Self-Hosted PostgreSQL
**Decision:** Use Neon.tech managed PostgreSQL  
**Rationale:** Free tier (500MB), serverless, no maintenance overhead, supports pgvector for Phase 2 duplicate detection. Self-hosting PostgreSQL on Replit wastes VM RAM.  
**Trade-off:** External dependency; network latency vs localhost.

### ADR-05: Supabase Storage over MinIO
**Decision:** Use Supabase Storage  
**Rationale:** Free tier (1GB), managed service, signed URL support, no additional container needed. MinIO requires hosting on Replit VM (consuming precious 512MB RAM).  
**Trade-off:** External dependency; Supabase free tier limits apply.

### ADR-06: Redux Toolkit + RTK Query over Zustand/React Query
**Decision:** Use Redux Toolkit with RTK Query  
**Rationale:** Mature ecosystem, built-in API caching, DevTools support, consistent pattern for auth state + server state.  
**Trade-off:** More boilerplate than Zustand for simple use cases.

### ADR-07: JWT in httpOnly Cookie for Refresh Token
**Decision:** Store refresh token in httpOnly cookie; access token in memory/localStorage  
**Rationale:** httpOnly cookies are not accessible to JavaScript — mitigates XSS attacks on the long-lived refresh token. Access token in memory limits exposure window to 30 minutes.  
**Trade-off:** Requires SameSite cookie configuration; CSRF consideration addressed by SameSite=Strict.
