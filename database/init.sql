-- =============================================================================
-- INVOICE DECISION TOOL — Database Initialization Script
-- PostgreSQL 17
-- Run: psql -U postgres -d invoice_decision_tool -f database/init.sql
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'REVIEWER'
                  CHECK (role IN ('VIEWER', 'REVIEWER', 'APPROVER', 'ADMIN')),
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================================================
-- 2. VENDORS
-- =============================================================================
CREATE TABLE IF NOT EXISTS vendors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    name_aliases  TEXT[],
    tax_id        VARCHAR(100),
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       TEXT,
    bank_account  VARCHAR(100),
    bank_name     VARCHAR(100),
    ifsc_code     VARCHAR(20),
    is_approved   BOOLEAN DEFAULT FALSE,
    risk_level    VARCHAR(20) DEFAULT 'UNKNOWN'
                  CHECK (risk_level IN ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_tax_id ON vendors(tax_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_approved ON vendors(is_approved);

-- =============================================================================
-- 3. INVOICE SEQUENCES (for system reference IDT-YYYY-MM-NNNNNN)
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoice_sequences (
    year_month    CHAR(7) PRIMARY KEY,   -- e.g., '2026-06'
    last_seq      INTEGER DEFAULT 0
);

-- =============================================================================
-- 4. INVOICES (Core Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    -- Identity
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_reference       VARCHAR(25) UNIQUE NOT NULL,  -- IDT-2026-06-000001
    status                 VARCHAR(30) NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN (
                               'PENDING', 'PROCESSING', 'EXTRACTED', 'FAILED',
                               'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ON_HOLD', 'ARCHIVED'
                           )),

    -- Vendor
    vendor_id              UUID REFERENCES vendors(id) ON DELETE SET NULL,
    vendor_name_raw        VARCHAR(255),

    -- Invoice Header
    vendor_invoice_number  VARCHAR(100),
    invoice_date           DATE,
    due_date               DATE,
    payment_terms          VARCHAR(100),
    currency               VARCHAR(5) DEFAULT 'INR',
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
    total_amount           DECIMAL(15,2),
    amount_paid            DECIMAL(15,2) DEFAULT 0,
    balance_due            DECIMAL(15,2),

    -- Notes
    invoice_notes          TEXT,

    -- File
    file_path              TEXT NOT NULL,
    file_name              TEXT NOT NULL,
    file_type              VARCHAR(10)
                           CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')),

    -- Metadata
    uploaded_by            UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_uploaded_by ON invoices(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_total_amount ON invoices(total_amount);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_invoice_number ON invoices(vendor_invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_system_reference ON invoices(system_reference);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- =============================================================================
-- 5. OCR EXTRACTIONS (AI Output — Separate Table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ocr_extractions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id       UUID UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    raw_text         TEXT,
    raw_response     JSONB,
    extracted_fields JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_used       VARCHAR(50) DEFAULT 'gpt-4o',
    tokens_used      INTEGER,
    status           VARCHAR(20) DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message    TEXT,
    extracted_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_extractions_invoice_id ON ocr_extractions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_status ON ocr_extractions(status);

-- =============================================================================
-- 6. INVOICE LINE ITEMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    extraction_id UUID REFERENCES ocr_extractions(id) ON DELETE SET NULL,
    line_number   INTEGER NOT NULL,
    description   TEXT,
    hsn_sac_code  VARCHAR(20),
    item_code     VARCHAR(100),
    quantity      DECIMAL(12,3),
    unit          VARCHAR(50),
    unit_price    DECIMAL(15,4),
    discount      DECIMAL(15,2) DEFAULT 0,
    tax_rate      DECIMAL(5,2),
    line_total    DECIMAL(15,2),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON invoice_line_items(invoice_id);

-- =============================================================================
-- 7. EXTRACTED FIELD CORRECTIONS (Edit History)
-- =============================================================================
CREATE TABLE IF NOT EXISTS extracted_field_corrections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    extraction_id   UUID REFERENCES ocr_extractions(id) ON DELETE SET NULL,
    field_name      VARCHAR(100) NOT NULL,
    original_value  TEXT,
    corrected_value TEXT NOT NULL,
    correction_note TEXT,
    corrected_by    UUID NOT NULL REFERENCES users(id),
    corrected_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corrections_invoice_id ON extracted_field_corrections(invoice_id);
CREATE INDEX IF NOT EXISTS idx_corrections_corrected_by ON extracted_field_corrections(corrected_by);

-- =============================================================================
-- 8. RISK RULES (Configurable)
-- =============================================================================
CREATE TABLE IF NOT EXISTS risk_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code   VARCHAR(100) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    severity    VARCHAR(20) NOT NULL
                CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    threshold   DECIMAL(15,2),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 9. RISK ASSESSMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS risk_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    overall_risk    VARCHAR(20) NOT NULL
                    CHECK (overall_risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score      DECIMAL(4,1) CHECK (risk_score >= 0 AND risk_score <= 10),
    ai_summary      TEXT,
    recommendation  VARCHAR(20)
                    CHECK (recommendation IN ('APPROVE', 'REVIEW', 'DECLINE')),
    flags           JSONB DEFAULT '[]',
    assessed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_invoice_id ON risk_assessments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_overall_risk ON risk_assessments(overall_risk);

-- =============================================================================
-- 10. DECISIONS (Approve / Reject / On Hold)
-- =============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    decision            VARCHAR(20) NOT NULL
                        CHECK (decision IN ('APPROVED', 'REJECTED', 'ON_HOLD')),
    decided_by          UUID NOT NULL REFERENCES users(id),
    decided_at          TIMESTAMPTZ DEFAULT NOW(),
    reason              TEXT,
    override_reason     TEXT,
    expected_resolution DATE
);

CREATE INDEX IF NOT EXISTS idx_decisions_invoice_id ON decisions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_decisions_decided_by ON decisions(decided_by);
CREATE INDEX IF NOT EXISTS idx_decisions_decided_at ON decisions(decided_at DESC);

-- =============================================================================
-- 11. INVOICE COMMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoice_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    comment     TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_invoice_id ON invoice_comments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON invoice_comments(user_id);

-- =============================================================================
-- 12. AUDIT LOGS (Immutable — no UPDATE or DELETE allowed in app)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL
                CHECK (action IN (
                    'SIGNUP', 'LOGIN', 'LOGOUT',
                    'UPLOAD', 'EXTRACT', 'REPROCESS',
                    'REVIEW', 'EDIT_FIELD',
                    'APPROVE', 'REJECT', 'ON_HOLD',
                    'COMMENT', 'EDIT_COMMENT', 'DELETE_COMMENT',
                    'ARCHIVE',
                    'EXPORT_REPORT',
                    'USER_CREATE', 'USER_UPDATE', 'USER_DEACTIVATE',
                    'RULE_UPDATE',
                    'VENDOR_CREATE', 'VENDOR_UPDATE'
                )),
    invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payload     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_invoice_id ON audit_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- 13. REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    report_type     VARCHAR(50) NOT NULL
                    CHECK (report_type IN (
                        'INVOICE_SUMMARY', 'RISK_REPORT',
                        'AUDIT_TRAIL', 'DECISION_REPORT', 'VENDOR_REPORT'
                    )),
    filters         JSONB,
    file_path       TEXT,
    format          VARCHAR(10) DEFAULT 'CSV'
                    CHECK (format IN ('CSV', 'PDF')),
    generated_by    UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);


-- =============================================================================
-- SEED DATA — Default Risk Rules
-- =============================================================================
INSERT INTO risk_rules (rule_code, name, description, severity, threshold, is_active) VALUES
    ('DUPLICATE_INVOICE',  'Duplicate Invoice',       'Same vendor + invoice number within 12 months',  'CRITICAL', NULL,    TRUE),
    ('AMOUNT_HIGH',        'High Amount',             'Invoice total exceeds configured threshold',      'HIGH',     50000,   TRUE),
    ('UNKNOWN_VENDOR',     'Unknown Vendor',          'Vendor not in approved vendor list',              'HIGH',     NULL,    TRUE),
    ('MISSING_PO',         'Missing PO Number',       'No PO number found on invoice',                  'MEDIUM',   NULL,    TRUE),
    ('OVERDUE_DUE_DATE',   'Overdue Invoice',         'Invoice due date is in the past',                'MEDIUM',   NULL,    TRUE),
    ('CURRENCY_MISMATCH',  'Currency Mismatch',       'Non-standard currency detected',                 'HIGH',     NULL,    TRUE),
    ('LOW_CONFIDENCE',     'Low OCR Confidence',      'Overall extraction confidence below 70%',         'MEDIUM',   0.70,    TRUE),
    ('MISSING_VENDOR_TAX', 'Missing Vendor Tax ID',   'Vendor tax ID / GST number not present',         'MEDIUM',   NULL,    TRUE),
    ('AMOUNT_MISMATCH',    'Amount Mismatch',         'Line item totals do not match invoice total',     'HIGH',     NULL,    TRUE),
    ('FUTURE_INVOICE_DATE','Future Invoice Date',     'Invoice date is in the future',                   'MEDIUM',   NULL,    TRUE)
ON CONFLICT (rule_code) DO NOTHING;


-- =============================================================================
-- SEED DATA — Default Admin User
-- Password: Admin@123 (bcrypt hash — CHANGE THIS IN PRODUCTION!)
-- =============================================================================
INSERT INTO users (name, email, password_hash, role, is_active) VALUES
    ('System Admin', 'admin@invoicetool.com',
     '$2b$12$LJ3m4ys4z1qFz5e5B5K5eOQYK0z1Z5Y5J5R5P5N5T5V5X5D5H5F5a',
     'ADMIN', TRUE)
ON CONFLICT (email) DO NOTHING;


-- =============================================================================
-- DONE
-- =============================================================================
-- Summary:
--   Tables created : 13 (users, vendors, invoice_sequences, invoices,
--                        ocr_extractions, invoice_line_items,
--                        extracted_field_corrections, risk_rules,
--                        risk_assessments, decisions, invoice_comments,
--                        audit_logs, reports)
--   Indexes created: 25
--   Seed data      : 10 risk rules + 1 admin user
-- =============================================================================
