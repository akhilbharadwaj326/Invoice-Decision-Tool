# 📄 Product Requirements Document (PRD)
## Invoice Decision Tool
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft — Awaiting Approval  
**Author:** Product Team  
**Repository:** [Invoice-Decision-Tool](https://github.com/akhilbharadwaj326/Invoice-Decision-Tool)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-architecture)
9. [Database Design](#9-database-design)
10. [API Specification](#10-api-specification)
11. [UI/UX Requirements](#11-uiux-requirements)
12. [Security Requirements](#12-security-requirements)
13. [Out of Scope (v1.0)](#13-out-of-scope-v10)
14. [Delivery Timeline](#14-delivery-timeline)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Tech Stack](#16-tech-stack)

---

## 1. Executive Summary

The **Invoice Decision Tool** is a web-based finance automation platform that enables Accounts Payable (AP) teams to:

- **Automatically extract** structured data from invoice documents (PDF/images) using AI
- **Assess risk** on each invoice using a configurable rule-based engine
- **Generate intelligent decisions** — Approve, Review, or Decline — with AI-generated rationale
- **Allow human oversight** — reviewers can edit extracted data, add comments, and make final approve/reject decisions
- **Maintain full auditability** — every action is logged for compliance

The tool replaces manual, error-prone invoice processing with a streamlined, AI-assisted workflow that reduces processing time and improves decision accuracy.

---

## 2. Problem Statement

### Current Pain Points

| Pain Point | Impact |
|---|---|
| Manual data entry from invoices | Slow, error-prone, labor-intensive |
| No standardized risk checks | Inconsistent decisions across team members |
| Approval process is email-based | No audit trail, lost context |
| Duplicate or fraudulent invoices slip through | Financial risk |
| No central dashboard for invoice status | No visibility for management |
| Report generation is manual (Excel) | Time-consuming, often inaccurate |

### Opportunity
Automating the extraction, risk assessment, and decision workflow can reduce invoice processing time from **hours to minutes** and significantly reduce human error.

---

## 3. Goals & Success Metrics

### Primary Goals
1. Reduce average invoice processing time by **≥ 70%**
2. Achieve **≥ 90%** OCR extraction accuracy on standard invoices
3. Ensure **100%** of decisions are logged and auditable
4. Enable **role-based access control** so only authorized users can approve

### Key Performance Indicators (KPIs)

| KPI | Target |
|---|---|
| Invoice processing time | < 2 minutes (upload to decision ready) |
| OCR field extraction accuracy | ≥ 90% confidence on structured invoices |
| System uptime | ≥ 99% (Replit Reserved VM) |
| User adoption (AP team) | 100% of team using tool within 2 weeks of launch |
| Audit completeness | 100% of actions logged |
| False positive risk flags | < 15% (flags that don't need review) |

---

## 4. Target Users & Personas

### Persona 1 — Priya (Accounts Payable Reviewer)
- **Role:** REVIEWER
- **Goal:** Quickly process invoices, review AI-extracted data, correct errors, add notes
- **Pain Point:** Manually typing invoice details into ERP system, hard to track invoice status
- **Key Actions:** Upload invoices, review extractions, edit fields, add comments

### Persona 2 — Rahul (Finance Manager / Approver)
- **Role:** APPROVER
- **Goal:** Make fast, informed approve/reject decisions based on risk assessments
- **Pain Point:** No context when approving — has to re-read invoices each time
- **Key Actions:** View risk flags, read AI summary, approve or reject with reason

### Persona 3 — Ananya (Finance Admin)
- **Role:** ADMIN
- **Goal:** Manage team access, monitor system health, configure rules, generate reports
- **Pain Point:** No single dashboard for oversight; managing access via email
- **Key Actions:** Manage users/roles, configure risk rules, view audit trail, generate reports

### Persona 4 — David (CFO / Stakeholder)
- **Role:** VIEWER
- **Goal:** High-level visibility into invoice volumes, approval rates, risk exposure
- **Pain Point:** Getting manual Excel reports from the AP team weekly
- **Key Actions:** View dashboard, download reports

---

## 5. User Stories

### Authentication
| ID | User Story | Priority |
|---|---|---|
| AUTH-01 | As a user, I can sign up with my name, email, and password so I can access the tool | 🔴 Must Have |
| AUTH-02 | As a user, I can log in with email and password to access my account | 🔴 Must Have |
| AUTH-03 | As a user, I am automatically logged out when my session expires | 🔴 Must Have |
| AUTH-04 | As an admin, I can change a user's role so they have appropriate permissions | 🔴 Must Have |
| AUTH-05 | As an admin, I can deactivate a user account to revoke access | 🔴 Must Have |
| AUTH-06 | As a user, I can reset my password via email link | 🟡 Should Have |

### Invoice Numbers
| ID | User Story | Priority |
|---|---|---|
| INV-N-01 | As a user, every uploaded invoice receives a unique system reference number (format: IDT-YYYY-MM-NNNNNN) automatically | 🔴 Must Have |
| INV-N-02 | As a reviewer, I can see both the system reference number and the vendor's original invoice number | 🔴 Must Have |
| INV-N-03 | The system shall flag a HIGH risk if the same vendor invoice number appears more than once for the same vendor | 🔴 Must Have |

### Invoice Management
| ID | User Story | Priority |
|---|---|---|
| INV-01 | As a reviewer, I can upload a PDF or image invoice so the system can process it | 🔴 Must Have |
| INV-02 | As a reviewer, I can see a list of all invoices with their status so I know what needs attention | 🔴 Must Have |
| INV-03 | As a reviewer, I can filter invoices by status, date range, amount, and risk level | 🔴 Must Have |
| INV-04 | As a reviewer, I can search invoices by invoice number or vendor name | 🔴 Must Have |
| INV-05 | As a reviewer, I can view the original invoice file alongside the extracted data | 🔴 Must Have |
| INV-06 | As a reviewer, I can archive a processed invoice for record-keeping | 🔴 Must Have |
| INV-07 | As a reviewer, I can re-trigger extraction if the first attempt failed | 🟡 Should Have |

### OCR & Data Extraction
| ID | User Story | Priority |
|---|---|---|
| OCR-01 | As a reviewer, I can see all extracted fields (vendor, amount, dates, PO number, etc.) | 🔴 Must Have |
| OCR-02 | As a reviewer, I can see a confidence score for each extracted field so I know what to double-check | 🔴 Must Have |
| OCR-03 | As a reviewer, I can edit any extracted field inline if the AI made an error | 🔴 Must Have |
| OCR-04 | As a reviewer, I can see the original AI value alongside my correction | 🔴 Must Have |
| OCR-05 | As a reviewer, I can see the full history of edits made to an invoice's fields | 🟡 Should Have |

### Risk Assessment
| ID | User Story | Priority |
|---|---|---|
| RISK-01 | As a reviewer, I can see all risk flags detected on an invoice with severity levels | 🔴 Must Have |
| RISK-02 | As a reviewer, I can see an AI-generated summary explaining the risk level | 🔴 Must Have |
| RISK-03 | As a reviewer, I can see the AI's recommendation (Approve / Review / Decline) | 🔴 Must Have |
| RISK-04 | As an admin, I can view and configure risk rules (enable/disable, change thresholds) | 🟡 Should Have |
| RISK-05 | As an admin, I can add a new risk rule with a code, severity, and threshold | 🟡 Should Have |

### Decision Workflow
| ID | User Story | Priority |
|---|---|---|
| DEC-01 | As an approver, I can approve an invoice with a single click | 🔴 Must Have |
| DEC-02 | As an approver, I can reject an invoice and must provide a reason | 🔴 Must Have |
| DEC-03 | As an approver, I am warned if my decision overrides the AI recommendation | 🔴 Must Have |
| DEC-04 | As an approver, I can place an invoice On Hold with a reason when I need more information | 🔴 Must Have |
| DEC-05 | As an approver, I can set an expected resolution date when placing an invoice On Hold | 🟡 Should Have |
| DEC-05 | As any user, I can see the decision history on an invoice | 🔴 Must Have |

### Comments
| ID | User Story | Priority |
|---|---|---|
| CMT-01 | As a reviewer, I can add a comment or note to any invoice | 🔴 Must Have |
| CMT-02 | As a reviewer, I can see all comments on an invoice in a threaded view | 🔴 Must Have |
| CMT-03 | As a reviewer, I can mark a comment as internal (team-only) or external | 🟡 Should Have |
| CMT-04 | As a reviewer, I can edit or delete my own comment | 🟡 Should Have |

### Reports
| ID | User Story | Priority |
|---|---|---|
| RPT-01 | As a reviewer, I can generate and download an Invoice Summary report as CSV | 🔴 Must Have |
| RPT-02 | As a reviewer, I can generate and download an Audit Trail report as CSV | 🔴 Must Have |
| RPT-03 | As an approver, I can generate a Decision Report (approval rates, timelines) | 🟡 Should Have |
| RPT-04 | As an admin, I can generate a Risk Report (risk distribution, flagged invoices) | 🟡 Should Have |
| RPT-05 | As an admin, I can download any report as PDF | 🟠 Nice to Have |

### Admin Panel
| ID | User Story | Priority |
|---|---|---|
| ADM-01 | As an admin, I can view a dashboard with system-wide KPIs | 🔴 Must Have |
| ADM-02 | As an admin, I can view, create, edit, and deactivate user accounts | 🔴 Must Have |
| ADM-03 | As an admin, I can view a full audit trail of all user actions | 🔴 Must Have |
| ADM-04 | As an admin, I can export the audit trail as CSV | 🔴 Must Have |
| ADM-05 | As an admin, I can manage the vendor master list | 🟡 Should Have |
| ADM-06 | As an admin, I can configure risk rules via a UI | 🟡 Should Have |

---

## 6. Functional Requirements

### FR-01: Authentication & Authorization
- The system shall support email + password authentication
- The system shall issue JWT access tokens (30-min expiry) and refresh tokens (7-day expiry)
- Refresh tokens shall be stored in httpOnly cookies
- The system shall enforce role-based access control with 4 roles: VIEWER, REVIEWER, APPROVER, ADMIN
- New user signups shall default to REVIEWER role
- Only ADMIN users may change roles or deactivate accounts

### FR-02: Invoice Upload
- The system shall accept PDF and image files (JPG, PNG, WEBP) up to 20MB
- The system shall store the original file in Supabase Storage
- The system shall create an invoice record in `PENDING` status immediately on upload
- The system shall trigger AI extraction asynchronously in a background task
- The system shall update invoice status: `PENDING → PROCESSING → EXTRACTED` (or `FAILED`)

### FR-03: AI Data Extraction
- The system shall send the invoice image/PDF to GPT-4o Vision API for extraction
- The system shall extract minimum fields: vendor name, invoice number, amount, currency, invoice date, due date, PO number, tax amount, line items
- The system shall store the raw GPT-4o response and structured extracted fields in `ocr_extractions` table
- The system shall store a confidence score (0.0–1.0) per extraction
- The system shall display fields color-coded by confidence: Green (≥0.90), Amber (0.70–0.89), Red (<0.70)

### FR-04: Risk Assessment
- On extraction completion, the system shall automatically run risk rules evaluation
- The system shall check predefined rules: amount threshold, missing PO, unknown vendor, overdue date, currency mismatch, low confidence
- The system shall generate an overall risk level: LOW / MEDIUM / HIGH / CRITICAL
- The system shall generate an overall risk score (0.0–10.0)
- The system shall store an AI-generated human-readable risk summary
- The system shall generate an AI recommendation: APPROVE / REVIEW / DECLINE

### FR-05: Review Interface
- The system shall display the original invoice file alongside extracted fields (split-panel view)
- The system shall allow inline editing of any extracted field
- Corrections shall be saved to `extracted_field_corrections` with the original value preserved
- The system shall display all risk flags with their severity and description
- The system shall display the AI-generated risk summary and recommendation

### FR-06: Decision Workflow

> **Important Distinction:**
> - **Validation** = System automatically verifies data completeness & rule compliance (automated, instant)
> - **Approval** = Authorized human business decision to proceed with payment (manual, role-gated)
> These are distinct stages. Validation is a prerequisite for review; Approval is the final business authorization.

- APPROVER and ADMIN roles may approve or reject invoices
- Rejection shall require a mandatory reason (minimum 10 characters)
- Invoices may be placed **On Hold** when more information is needed before a decision
- On Hold must include a reason and optional expected resolution date
- On Hold invoices may return to UNDER_REVIEW once the issue is resolved
- If the user's decision differs from the AI recommendation, a warning modal shall appear requiring confirmation
- Decisions shall be stored in the `decisions` table with timestamp and user ID
- Invoice status shall update to `APPROVED`, `REJECTED`, or `ON_HOLD` upon decision

### FR-07: Comments
- Any authenticated user (REVIEWER and above) may add comments to an invoice
- Comments shall display the author name, timestamp, and content
- Comments shall be visible to all users with access to the invoice
- Internal comments shall be marked with a badge

### FR-08: Archive
- Any user (REVIEWER and above) may archive an invoice after a decision has been made
- Archived invoices are read-only — no further editing or decisions
- Archived invoices remain searchable and viewable

### FR-09: Reports (CSV)
- The system shall generate the following CSV reports:
  1. **Invoice Summary**: ID, vendor, amount, status, uploaded by, decision date
  2. **Audit Trail**: timestamp, user, action, invoice ID, details
  3. **Decision Report**: invoice ID, AI recommendation, human decision, match/override flag
  4. **Risk Report**: invoice ID, risk level, risk score, flags triggered

### FR-10: Admin Panel
- Admin dashboard shall display: total invoices by status, approval rate, average processing time, recent high-risk invoices
- User management shall support Create, Read, Update (role/status), Deactivate
- Audit trail shall be paginated and filterable by user, action, date range

---

## 7. Non-Functional Requirements

### Performance
- Invoice upload and initial processing response: < 3 seconds
- GPT-4o extraction (background): < 60 seconds per invoice
- Invoice list page load: < 2 seconds
- API response time (95th percentile): < 500ms

### Scalability
- v1.0 target: up to 50 concurrent users, 500 invoices/month
- Database shall be indexed on: `invoices.status`, `invoices.created_at`, `invoices.uploaded_by`

### Reliability
- System uptime target: ≥ 99%
- All API endpoints shall return appropriate HTTP status codes and error messages
- Failed GPT-4o extractions shall be retried up to 2 times before marking as FAILED

### Usability
- All pages shall be responsive (works on desktop and tablet)
- Loading states shall be shown for all async operations
- Error messages shall be human-readable and actionable
- All forms shall have inline validation with clear error messages

### Accessibility
- All interactive elements shall have unique IDs
- Color-coded elements (confidence, risk) shall also use text labels (not color alone)
- Keyboard navigable primary flows

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REPLIT HOSTING                           │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   React Frontend    │    │     FastAPI Backend           │   │
│  │   (Static Deploy)   │───▶│   (Reserved VM 0.5vCPU/512MB)│   │
│  │   Vite + Tailwind   │    │   Python 3.12 + Uvicorn      │   │
│  │   Shadcn/UI         │    │   BackgroundTasks (async)    │   │
│  └─────────────────────┘    └──────────────┬───────────────┘   │
│                                            │                    │
└────────────────────────────────────────────┼────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────┐
              │                             │                    │
              ▼                             ▼                    ▼
   ┌─────────────────┐          ┌──────────────────┐  ┌─────────────────┐
   │  Neon.tech      │          │  OpenAI API      │  │ Supabase Storage│
   │  PostgreSQL 16  │          │  GPT-4o Vision   │  │  Invoice Files  │
   │  (Free tier)    │          │  (Your API Key)  │  │  (Free 1GB)     │
   └─────────────────┘          └──────────────────┘  └─────────────────┘
```

### Request Flow — Invoice Processing

```
1. User uploads invoice (React) 
   → POST /api/invoices/upload (FastAPI)
   → File saved to Supabase Storage
   → Invoice record created (status: PENDING)
   → Background task triggered

2. Background Task (FastAPI BackgroundTasks)
   → Convert PDF to image (if needed)
   → Send to GPT-4o Vision API with extraction prompt
   → Parse structured response
   → Save to ocr_extractions (status: COMPLETED)
   → Run risk rules engine
   → Save to risk_assessments
   → Update invoice status: EXTRACTED

3. Frontend polls GET /api/invoices/{id} 
   → Detects status = EXTRACTED
   → Renders extracted fields + risk panel
```

---

## 9. Database Design

### Entity Relationship Summary

```
users ──< invoices ──── ocr_extractions
      ──< decisions        |
      ──< comments         └──< extracted_field_corrections
      ──< audit_logs
vendors ──< invoices
invoices ──── risk_assessments ──< risk_flags
invoices ──< invoice_comments
invoices ──< decisions
risk_rules ──< risk_flags
```

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | User accounts & roles | id, email, password_hash, role, is_active |
| `invoices` | Core invoice storage | id, system_reference (IDT-YYYY-MM-NNNNNN), vendor_id, vendor_name_raw, vendor_invoice_number, amount, status, file_path |
| `ocr_extractions` | AI extraction output | invoice_id, extracted_fields (JSONB), confidence_score |
| `extracted_field_corrections` | User edit history | invoice_id, field_name, original_value, corrected_value |
| `risk_assessments` | Risk analysis results | invoice_id, overall_risk, risk_score, recommendation |
| `risk_flags` | Individual rule triggers | assessment_id, rule_code, severity, description |
| `decisions` | Approve/Reject records | invoice_id, decision, decided_by, reason |
| `invoice_comments` | User comments/notes | invoice_id, user_id, comment, is_internal |
| `audit_logs` | All user actions | user_id, action, invoice_id, payload |
| `risk_rules` | Configurable rules | rule_code, severity, threshold, is_active |
| `vendors` | Vendor master list | name, tax_id, is_approved, risk_level |

### Invoice Status State Machine

```
PENDING ──▶ PROCESSING ──▶ EXTRACTED ──▶ UNDER_REVIEW
                │                         ┌────┼────┐
                ▼                         │    │    │
             FAILED ──▶ (re-process)  APPROVED REJECTED ON_HOLD
                                          │    │    │
                                          └────┼────┘
                                               │
                                           ARCHIVED (read-only)
```

> **ON_HOLD:** Invoice is paused pending more information (e.g., vendor clarification, PO mismatch). On Hold invoices return to UNDER_REVIEW once resolved.

---

## 10. API Specification

### Base URL
```
Development: http://localhost:8000
Production:  https://invoice-backend.replit.app
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| POST | `/api/auth/logout` | Bearer | Logout, invalidate token |
| GET | `/api/auth/me` | Bearer | Get current user |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |

#### POST `/api/auth/signup` — Request Body
```json
{
  "name": "Priya Sharma",
  "email": "priya@company.com",
  "password": "SecurePass123!"
}
```

#### POST `/api/auth/login` — Response
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "name": "Priya Sharma",
    "email": "priya@company.com",
    "role": "REVIEWER"
  }
}
```

---

### Invoice Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/invoices/upload` | Bearer | REVIEWER+ | Upload invoice file |
| GET | `/api/invoices` | Bearer | REVIEWER+ | List invoices (paginated + filters) |
| GET | `/api/invoices/{id}` | Bearer | REVIEWER+ | Get invoice detail |
| PATCH | `/api/invoices/{id}/status` | Bearer | ADMIN | Update status manually |
| POST | `/api/invoices/{id}/archive` | Bearer | REVIEWER+ | Archive invoice |
| POST | `/api/invoices/{id}/reprocess` | Bearer | REVIEWER+ | Re-trigger OCR |

#### GET `/api/invoices` — Query Parameters
```
status       = PENDING | PROCESSING | EXTRACTED | UNDER_REVIEW | APPROVED | REJECTED | ARCHIVED
risk_level   = LOW | MEDIUM | HIGH | CRITICAL
date_from    = YYYY-MM-DD
date_to      = YYYY-MM-DD
amount_min   = float
amount_max   = float
search       = string (invoice number or vendor name)
page         = int (default: 1)
page_size    = int (default: 20, max: 100)
```

---

### Extraction Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/invoices/{id}/extraction` | Bearer | REVIEWER+ | Get OCR result |
| PATCH | `/api/invoices/{id}/fields` | Bearer | REVIEWER+ | Correct extracted fields |
| GET | `/api/invoices/{id}/corrections` | Bearer | REVIEWER+ | Get correction history |

#### PATCH `/api/invoices/{id}/fields` — Request Body
```json
{
  "corrections": [
    {
      "field_name": "amount",
      "corrected_value": "45000.00",
      "note": "OCR misread decimal"
    }
  ]
}
```

---

### Decision Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/invoices/{id}/approve` | Bearer | APPROVER+ | Approve invoice |
| POST | `/api/invoices/{id}/reject` | Bearer | APPROVER+ | Reject invoice |
| GET | `/api/invoices/{id}/decision` | Bearer | REVIEWER+ | Get decision |

#### POST `/api/invoices/{id}/reject` — Request Body
```json
{
  "reason": "Vendor not in approved list and amount exceeds threshold.",
  "override_reason": null
}
```

---

### Comment Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/invoices/{id}/comments` | Bearer | REVIEWER+ | Get comments |
| POST | `/api/invoices/{id}/comments` | Bearer | REVIEWER+ | Add comment |
| PATCH | `/api/comments/{id}` | Bearer | REVIEWER+ | Edit own comment |
| DELETE | `/api/comments/{id}` | Bearer | REVIEWER+ | Delete own comment |

---

### Report Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/reports/generate` | Bearer | REVIEWER+ | Generate report |
| GET | `/api/reports` | Bearer | REVIEWER+ | List reports |
| GET | `/api/reports/{id}/download` | Bearer | REVIEWER+ | Download file |

#### POST `/api/reports/generate` — Request Body
```json
{
  "report_type": "INVOICE_SUMMARY",
  "format": "CSV",
  "filters": {
    "date_from": "2026-01-01",
    "date_to": "2026-06-30",
    "status": ["APPROVED", "REJECTED"]
  }
}
```

---

### Admin Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/admin/stats` | Bearer | ADMIN | Dashboard KPIs |
| GET | `/api/admin/users` | Bearer | ADMIN | List users |
| POST | `/api/admin/users` | Bearer | ADMIN | Create user |
| PATCH | `/api/admin/users/{id}` | Bearer | ADMIN | Update role/status |
| GET | `/api/admin/audit-logs` | Bearer | ADMIN | Audit trail |
| GET | `/api/admin/rules` | Bearer | ADMIN | Risk rules |
| PATCH | `/api/admin/rules/{id}` | Bearer | ADMIN | Update rule |

---

## 11. UI/UX Requirements

### Design System
- **Primary Color:** Indigo (#4F46E5)
- **Font:** Inter (Google Fonts)
- **Style:** Dark mode support, glassmorphism cards, subtle shadows
- **Components:** Shadcn/UI + Radix UI primitives
- **Icons:** Lucide React

### Key Pages

| Page | Route | Key Components |
|---|---|---|
| Login | `/login` | Email/password form, sign up link |
| Signup | `/signup` | Name/email/password form, login link |
| Dashboard | `/dashboard` | KPI cards, recent invoices table, status chart |
| Invoice List | `/invoices` | Filterable table, search, status badges, risk badges |
| Upload | `/invoices/upload` | Drag & drop zone, file preview, upload progress |
| Invoice Detail | `/invoices/:id` | Split panel: PDF viewer + extracted fields |
| — Review Tab | | Field editor, confidence badges, risk flags panel |
| — Decision Tab | | Approve/Reject buttons, AI recommendation card |
| — Comments Tab | | Comment thread, add comment form |
| — History Tab | | Edit history, audit timeline |
| Reports | `/reports` | Report type selector, date filter, download button |
| Admin | `/admin` | Stats cards, Recharts charts |
| Admin / Users | `/admin/users` | User table, role dropdown, activate/deactivate |
| Admin / Audit | `/admin/audit` | Filterable audit log table |

### Status Badges (Color Coding)

| Status | Color |
|---|---|
| PENDING | Gray |
| PROCESSING | Blue (pulsing) |
| EXTRACTED | Purple |
| UNDER_REVIEW | Amber |
| APPROVED | Green |
| REJECTED | Red |
| ARCHIVED | Gray (muted) |

### Risk Level Badges

| Risk | Color |
|---|---|
| LOW | Green |
| MEDIUM | Amber |
| HIGH | Orange |
| CRITICAL | Red |

### Confidence Score Display

| Score | Color | Label |
|---|---|---|
| ≥ 0.90 | 🟢 Green | High Confidence |
| 0.70–0.89 | 🟡 Amber | Medium Confidence |
| < 0.70 | 🔴 Red | Low Confidence — Verify |

---

## 12. Security Requirements

| Requirement | Implementation |
|---|---|
| Password storage | bcrypt hashing (cost factor 12) |
| JWT signing | HS256 with 256-bit secret key |
| Refresh tokens | httpOnly, Secure, SameSite=Strict cookies |
| File uploads | Type validation (PDF/JPG/PNG only), 20MB size limit |
| SQL injection | SQLAlchemy ORM parameterized queries |
| CORS | Whitelist frontend origin only |
| Rate limiting | 60 requests/minute per IP on auth endpoints |
| Sensitive data | OpenAI API key stored in environment variables only |
| Role enforcement | Server-side role check on every protected endpoint |
| Audit logging | Every data-modifying action logged with user + timestamp |

---

## 13. Out of Scope (v1.0)

The following features are **explicitly deferred** to Phase 2:

- ❌ Forgot password / email reset flow
- ❌ Email notifications (approve/reject alerts)
- ❌ ERP/SAP integration
- ❌ Email ingestion of invoices
- ❌ PDF report generation (CSV only in v1.0)
- ❌ Scheduled/recurring reports
- ❌ Mobile app (iOS/Android)
- ❌ Multi-company / multi-tenant support
- ❌ Invoice line item detailed analysis
- ❌ Vendor portal (external access)
- ❌ Two-factor authentication (2FA)
- ❌ Dark/Light mode toggle (default: system preference)

---

## 14. Delivery Timeline (1 Week)

| Day | Focus | Deliverable |
|---|---|---|
| **Day 1** | Setup + Auth | Login, Signup, JWT, DB schema, protected routes |
| **Day 2** | Invoice Upload + OCR | Upload UI, GPT-4o extraction, storage, DB records |
| **Day 3** | Invoice List + Detail | Dashboard, invoice table, detail split-panel |
| **Day 4** | Review Actions | Field editing, corrections, risk flags, AI summary |
| **Day 5** | Decisions + Comments | Approve/Reject, comment thread, audit logging |
| **Day 6** | Admin + Reports | Admin panel, user management, CSV reports |
| **Day 7** | Polish + Deploy | Error handling, responsive UI, Replit deployment |

### Milestones

```
Day 1 EOD: User can sign up, log in, and see an empty dashboard
Day 2 EOD: User can upload an invoice and see it processing
Day 3 EOD: User can view extracted data on invoice detail page
Day 4 EOD: User can edit fields and see risk flags
Day 5 EOD: Approver can approve/reject; comments work
Day 6 EOD: Admin panel live; CSV reports downloadable
Day 7 EOD: Full app live on Replit; smoke test passed
```

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GPT-4o extraction inaccurate for non-standard invoices | Medium | High | Manual edit flow covers this; confidence scores flag low-quality results |
| Replit 512MB RAM exceeded | Low | High | No heavy OCR libs; GPT-4o Vision replaces them; monitor memory usage |
| GPT-4o API rate limits hit | Low | Medium | Add retry logic with exponential backoff (max 3 retries) |
| Neon PostgreSQL free tier limits (500MB) | Low | Medium | v1.0 volume is low; upgrade to paid if needed |
| Supabase Storage free tier (1GB) hit | Low | Low | Monitor usage; implement file size limits (20MB max) |
| 1-week timeline is tight | High | Medium | Prioritized MVP scope; Phase 2 for non-critical features |
| PDF conversion fails for some formats | Medium | Medium | Fallback: upload image directly; re-process option |

---

## 16. Tech Stack

| Layer | Technology | Version | License |
|---|---|---|---|
| **Frontend** | React | 18.x | MIT |
| **Build Tool** | Vite | 5.x | MIT |
| **Styling** | Tailwind CSS | 3.x | MIT |
| **UI Components** | Shadcn/UI + Radix UI | Latest | MIT |
| **State** | Redux Toolkit + RTK Query | 2.x | MIT |
| **Forms** | React Hook Form + Zod | Latest | MIT |
| **Charts** | Recharts | 2.x | MIT |
| **Routing** | React Router v6 | 6.x | MIT |
| **Backend** | Python FastAPI | 0.111+ | MIT |
| **Server** | Uvicorn | 0.30+ | BSD |
| **ORM** | SQLAlchemy 2.0 (async) | 2.x | MIT |
| **Migrations** | Alembic | 1.x | MIT |
| **Validation** | Pydantic v2 | 2.x | MIT |
| **Auth** | python-jose + passlib | Latest | MIT |
| **HTTP Client** | httpx | 0.27+ | BSD |
| **AI / OCR** | OpenAI Python SDK | 1.x | MIT |
| **PDF Processing** | pdf2image + Pillow | Latest | MIT |
| **Database** | PostgreSQL 16 (Neon.tech) | 16.x | PostgreSQL |
| **File Storage** | Supabase Storage | — | Apache 2.0 |
| **Hosting (FE)** | Replit Static Deploy | — | — |
| **Hosting (BE)** | Replit Reserved VM | — | — |

---

*Document Version: 1.0 | Status: Draft*  
*Next Review: Before Day 1 development kickoff*
