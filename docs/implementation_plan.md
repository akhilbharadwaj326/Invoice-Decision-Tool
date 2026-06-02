# Invoice Decision Tool — 1-Week MVP Delivery Plan
> 🚀 Target: Full working MVP in 7 days · React + FastAPI + GPT-4o Vision + Neon PostgreSQL

---

## ✅ MVP Scope (This Week) vs 🔜 Phase 2 (Later)

| Feature | This Week (MVP) | Phase 2 |
|---|---|---|
| Login / Signup pages | ✅ | — |
| JWT Auth + Protected routes | ✅ | — |
| Role-based access (Admin/Approver/Reviewer) | ✅ | — |
| Invoice upload (PDF/Image) | ✅ | — |
| GPT-4o Vision extraction | ✅ | — |
| Invoice list with filters | ✅ | — |
| Invoice detail + extracted fields | ✅ | — |
| Risk flags + AI summary | ✅ | — |
| Edit / Correct extracted fields | ✅ | — |
| Approve / Reject with reason | ✅ | — |
| Add comments | ✅ | — |
| Archive invoice | ✅ | — |
| Basic Admin panel | ✅ | — |
| User management (Admin) | ✅ | — |
| CSV report export | ✅ | — |
| PDF report generation | 🔜 | Phase 2 |
| Email notifications | 🔜 | Phase 2 |
| Vendor management UI | 🔜 | Phase 2 |
| Risk rules config UI | 🔜 | Phase 2 |
| Scheduled reports | 🔜 | Phase 2 |
| Forgot password / Email reset | 🔜 | Phase 2 |

---

## Authentication System

### Auth Pages

#### 1. Login Page (`/login`)
```
┌─────────────────────────────────────┐
│   🧾 Invoice Decision Tool          │
│   Sign in to your account           │
│                                     │
│   Email    [____________________]   │
│   Password [____________________]   │
│                                     │
│   [        Sign In          ]       │
│                                     │
│   Don't have an account? Sign Up    │
└─────────────────────────────────────┘
```

#### 2. Signup Page (`/signup`)
```
┌─────────────────────────────────────┐
│   🧾 Invoice Decision Tool          │
│   Create your account               │
│                                     │
│   Full Name  [__________________]   │
│   Email      [__________________]   │
│   Password   [__________________]   │
│   Confirm Pw [__________________]   │
│                                     │
│   [      Create Account     ]       │
│                                     │
│   Already have an account? Login    │
└─────────────────────────────────────┘
```

> **Note:** New signups default to `REVIEWER` role. Admin promotes to `APPROVER` or `ADMIN`.

### Auth Flow
```
Signup → Default role: REVIEWER → Admin promotes role
Login  → JWT Access Token (30 min) + Refresh Token (7 days)
       → Stored in httpOnly Cookie (secure)
All API calls → Bearer token in Authorization header
Expired token → Auto-refresh via /auth/refresh
Logout → Invalidate refresh token
```

### Role Permissions

| Feature | VIEWER | REVIEWER | APPROVER | ADMIN |
|---|---|---|---|---|
| View invoices | ✅ | ✅ | ✅ | ✅ |
| Upload invoices | ❌ | ✅ | ✅ | ✅ |
| Edit extracted fields | ❌ | ✅ | ✅ | ✅ |
| Add comments | ❌ | ✅ | ✅ | ✅ |
| Approve / Reject | ❌ | ❌ | ✅ | ✅ |
| Generate reports | ❌ | ✅ | ✅ | ✅ |
| Admin panel access | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Override decisions | ❌ | ❌ | ❌ | ✅ |

---

## Database Schema (Complete)

```sql
-- 1. USERS
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) DEFAULT 'REVIEWER',
    -- VIEWER / REVIEWER / APPROVER / ADMIN
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VENDORS
CREATE TABLE vendors (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    tax_id     VARCHAR(100),
    email      VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(20) DEFAULT 'UNKNOWN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES (Core Storage)
CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100),
    vendor_id      UUID REFERENCES vendors(id),
    amount         DECIMAL(15,2),
    currency       VARCHAR(10) DEFAULT 'USD',
    invoice_date   DATE,
    due_date       DATE,
    po_number      VARCHAR(100),
    file_path      TEXT NOT NULL,
    file_name      TEXT NOT NULL,
    status         VARCHAR(30) DEFAULT 'PENDING',
    -- PENDING → PROCESSING → EXTRACTED → UNDER_REVIEW
    -- → APPROVED / REJECTED / ARCHIVED
    uploaded_by    UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OCR EXTRACTIONS (Separate Table - AI Output)
CREATE TABLE ocr_extractions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id       UUID REFERENCES invoices(id) ON DELETE CASCADE,
    raw_text         TEXT,
    extracted_fields JSONB,
    -- { vendor_name, invoice_number, amount, currency,
    --   invoice_date, due_date, po_number, tax_amount,
    --   line_items: [...], bank_details: {...} }
    confidence_score DECIMAL(4,3),
    model_used       VARCHAR(50) DEFAULT 'gpt-4o',
    tokens_used      INTEGER,
    status           VARCHAR(20) DEFAULT 'PENDING',
    -- PENDING / PROCESSING / COMPLETED / FAILED
    error_message    TEXT,
    extracted_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FIELD CORRECTIONS (Edit History)
CREATE TABLE extracted_field_corrections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES invoices(id),
    field_name      VARCHAR(100) NOT NULL,
    original_value  TEXT,
    corrected_value TEXT NOT NULL,
    corrected_by    UUID REFERENCES users(id),
    corrected_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RISK ASSESSMENTS
CREATE TABLE risk_assessments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id     UUID REFERENCES invoices(id) ON DELETE CASCADE,
    overall_risk   VARCHAR(20),   -- LOW / MEDIUM / HIGH / CRITICAL
    risk_score     DECIMAL(4,1),  -- 0.0 to 10.0
    ai_summary     TEXT,
    recommendation VARCHAR(20),  -- APPROVE / REVIEW / DECLINE
    flags          JSONB,
    -- [{ rule_code, severity, description, flagged_value }]
    assessed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DECISIONS
CREATE TABLE decisions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id     UUID REFERENCES invoices(id),
    decision       VARCHAR(20) NOT NULL, -- APPROVED / REJECTED / DEFERRED
    decided_by     UUID REFERENCES users(id),
    decided_at     TIMESTAMPTZ DEFAULT NOW(),
    reason         TEXT,
    override_reason TEXT
);

-- 8. COMMENTS
CREATE TABLE invoice_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID REFERENCES invoices(id),
    user_id     UUID REFERENCES users(id),
    comment     TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AUDIT LOGS
CREATE TABLE audit_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id),
    action     VARCHAR(100) NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    payload    JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RISK RULES (Configurable)
CREATE TABLE risk_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code   VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255),
    description TEXT,
    severity    VARCHAR(20),
    threshold   DECIMAL(15,2),
    is_active   BOOLEAN DEFAULT TRUE
);

-- Seed risk rules
INSERT INTO risk_rules VALUES
  (gen_random_uuid(), 'AMOUNT_HIGH', 'High Amount', 'Invoice amount exceeds threshold', 'HIGH', 50000, true),
  (gen_random_uuid(), 'MISSING_PO', 'Missing PO Number', 'No PO number on invoice', 'MEDIUM', null, true),
  (gen_random_uuid(), 'MISSING_VENDOR', 'Unknown Vendor', 'Vendor not in approved list', 'HIGH', null, true),
  (gen_random_uuid(), 'DUE_DATE_PAST', 'Overdue Invoice', 'Due date is in the past', 'MEDIUM', null, true),
  (gen_random_uuid(), 'CURRENCY_MISMATCH', 'Currency Mismatch', 'Non-standard currency detected', 'HIGH', null, true),
  (gen_random_uuid(), 'LOW_CONFIDENCE', 'Low OCR Confidence', 'Extraction confidence below 70%', 'MEDIUM', null, true);
```

---

## 7-Day Delivery Schedule

### 📅 Day 1 — Project Setup + Authentication
**Backend:**
- [ ] FastAPI project scaffold (`backend/`)
- [ ] PostgreSQL connection (Neon.tech)
- [ ] Alembic migrations — all tables
- [ ] Auth endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [ ] JWT middleware (access + refresh tokens)
- [ ] Password hashing (bcrypt via passlib)
- [ ] Role-based dependency guards

**Frontend:**
- [ ] Vite + React + Tailwind + Shadcn/UI scaffold (`frontend/`)
- [ ] Auth context + JWT token management
- [ ] Login page (`/login`)
- [ ] Signup page (`/signup`)
- [ ] Protected route wrapper
- [ ] App shell layout (sidebar + topbar)

---

### 📅 Day 2 — Invoice Upload + GPT-4o Extraction
**Backend:**
- [ ] `POST /api/invoices/upload` — save file to Supabase Storage
- [ ] Background task: send to GPT-4o Vision → parse response
- [ ] Store in `invoices` + `ocr_extractions` tables
- [ ] `GET /api/invoices/{id}/extraction` — return OCR result
- [ ] Risk rules evaluation → store in `risk_assessments`

**Frontend:**
- [ ] Upload page (`/invoices/upload`) — drag & drop + file picker
- [ ] Upload progress indicator
- [ ] Redirect to invoice detail after upload
- [ ] Processing skeleton loader while GPT-4o runs

---

### 📅 Day 3 — Invoice List + Detail View
**Backend:**
- [ ] `GET /api/invoices` — paginated list with filters (status, date, amount)
- [ ] `GET /api/invoices/{id}` — full detail with extraction + risk

**Frontend:**
- [ ] Dashboard page (`/dashboard`) — stats cards + recent invoices
- [ ] Invoice list page (`/invoices`) — table with filters, search, sort
- [ ] Invoice detail page (`/invoices/:id`):
  - Left panel: Invoice image viewer
  - Right panel: Extracted fields with confidence scores
  - Bottom: Risk flags panel + AI summary

---

### 📅 Day 4 — Review Actions (Edit + Risk)
**Backend:**
- [ ] `PATCH /api/invoices/{id}/fields` — save field corrections
- [ ] `GET /api/invoices/{id}/corrections` — correction history

**Frontend:**
- [ ] Inline field editing (click to edit any extracted field)
- [ ] Confidence color badges (🟢 ≥90% / 🟡 ≥70% / 🔴 <70%)
- [ ] Risk flags panel with severity badges (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] AI insight summary card
- [ ] Side-by-side image + fields view (split panel)

---

### 📅 Day 5 — Decisions + Comments
**Backend:**
- [ ] `POST /api/invoices/{id}/approve` — approve invoice
- [ ] `POST /api/invoices/{id}/reject` — reject with reason
- [ ] `GET/POST /api/invoices/{id}/comments` — comment CRUD
- [ ] Audit log entries on every action

**Frontend:**
- [ ] Approve / Reject buttons (role-gated to APPROVER+)
- [ ] Reject reason modal (mandatory text)
- [ ] Override warning if AI recommendation differs
- [ ] Comment thread with timestamps
- [ ] Action history timeline on invoice detail

---

### 📅 Day 6 — Admin Panel + Reports
**Backend:**
- [ ] `GET /api/admin/stats` — dashboard KPIs
- [ ] `GET/PATCH /api/admin/users` — user management
- [ ] `POST /api/reports/generate` — CSV export (invoice summary + audit)
- [ ] `GET /api/reports/{id}/download` — file download

**Frontend:**
- [ ] Admin panel (`/admin`) — role-gated
- [ ] Admin dashboard (Recharts): Invoice volume, approval rate, risk distribution
- [ ] User management table (list, change role, deactivate)
- [ ] Reports page — select type, date range, download CSV
- [ ] Audit trail table (filterable)

---

### 📅 Day 7 — Polish + Deploy to Replit
- [ ] Error handling & loading states across all pages
- [ ] Responsive layout (tablet friendly)
- [ ] Form validations (Zod schemas)
- [ ] Toast notifications (success/error/warning)
- [ ] Deploy frontend to Replit Static
- [ ] Deploy backend to Replit Reserved VM
- [ ] Connect Neon PostgreSQL + Supabase Storage env vars
- [ ] End-to-end smoke test: Signup → Upload → Extract → Review → Approve
- [ ] README with setup instructions

---

## Frontend Routes Summary

```
/login                    → Login (public)
/signup                   → Signup (public)
/dashboard                → Main dashboard (all roles)
/invoices                 → Invoice list (REVIEWER+)
/invoices/upload          → Upload invoice (REVIEWER+)
/invoices/:id             → Invoice detail + review (REVIEWER+)
/reports                  → Reports center (REVIEWER+)
/admin                    → Admin dashboard (ADMIN only)
/admin/users              → User management (ADMIN only)
/admin/audit              → Audit trail (ADMIN only)
```

---

## Folder Structure

```
Invoice-Decision-Tool/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn/UI base components
│   │   │   ├── layout/          # Sidebar, Topbar, AppShell
│   │   │   ├── invoices/        # InvoiceCard, InvoiceTable, FieldEditor
│   │   │   ├── auth/            # LoginForm, SignupForm, ProtectedRoute
│   │   │   └── admin/           # AdminStats, UserTable
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── InvoiceListPage.tsx
│   │   │   ├── InvoiceUploadPage.tsx
│   │   │   ├── InvoiceDetailPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── UserManagement.tsx
│   │   │       └── AuditTrail.tsx
│   │   ├── store/               # Redux + RTK Query
│   │   │   ├── authSlice.ts
│   │   │   ├── invoiceApi.ts
│   │   │   └── adminApi.ts
│   │   ├── hooks/               # useAuth, useInvoice, useRole
│   │   └── lib/                 # utils, constants, types
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Login, signup, refresh, me
│   │   │   ├── invoices.py      # Invoice CRUD + upload
│   │   │   ├── extraction.py    # OCR + field correction
│   │   │   ├── decisions.py     # Approve/Reject
│   │   │   ├── comments.py      # Comment CRUD
│   │   │   ├── reports.py       # CSV generation
│   │   │   └── admin.py         # Admin endpoints
│   │   ├── core/
│   │   │   ├── config.py        # Env vars, settings
│   │   │   ├── security.py      # JWT, password hashing
│   │   │   └── deps.py          # Auth dependencies, role guards
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── gpt_vision.py    # GPT-4o Vision OCR service
│   │   │   ├── risk_engine.py   # Risk rules evaluation
│   │   │   ├── storage.py       # Supabase file upload
│   │   │   └── report.py        # CSV generation
│   │   └── main.py
│   ├── alembic/
│   └── tests/
│
├── .env.example
├── docker-compose.yml           # For local dev
├── .github/workflows/
└── README.md
```

---

## Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql+asyncpg://user:pass@neon.tech/invoicedb
SECRET_KEY=your-super-secret-jwt-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

OPENAI_API_KEY=your-openai-api-key

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET=invoices

# Frontend (.env)
VITE_API_BASE_URL=https://your-replit-backend.repl.co
```

---

## Final Stack Summary

| Layer | Tech | Cost |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind + Shadcn/UI | Free |
| Backend | Python FastAPI + BackgroundTasks | ~$8/mo (Replit) |
| Auth | JWT (python-jose + passlib/bcrypt) | Free |
| AI + OCR | OpenAI GPT-4o Vision | ~$0.01/invoice |
| Rules Engine | Python (in FastAPI) | Free |
| Database | PostgreSQL via Neon.tech | Free |
| File Storage | Supabase Storage | Free |
| **Total** | | **~$8/mo + OpenAI usage** |
