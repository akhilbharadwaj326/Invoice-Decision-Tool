"""
seed_data.py — Populates the database with realistic test data for E2E testing.
Run: .venv\Scripts\python.exe seed_data.py
"""
import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:Sindhu826%40@localhost:5432/invoice_decision_tool"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def utcnow():
    return datetime.now(timezone.utc)

def days_ago(n):
    return datetime.now(timezone.utc) - timedelta(days=n)


async def seed():
    async with AsyncSessionLocal() as db:

        # ── 1. Admin user ──────────────────────────────────────────────────────
        result = await db.execute(text("SELECT id FROM users WHERE email = 'admin@invoicetool.com'"))
        admin = result.fetchone()
        if not admin:
            print("❌ Admin user not found. Please login/signup first.")
            return
        admin_id = admin[0]
        print(f"[OK] Admin: {admin_id}")

        # ── 2. Reviewer user ───────────────────────────────────────────────────
        result = await db.execute(text("SELECT id FROM users WHERE email = 'reviewer@invoicetool.com'"))
        reviewer = result.fetchone()
        if not reviewer:
            import bcrypt
            hashed = bcrypt.hashpw(b"reviewer123", bcrypt.gensalt()).decode()
            reviewer_id = uuid.uuid4()
            await db.execute(text(
                "INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at) "
                "VALUES (:id, :name, :email, :pw, 'REVIEWER', true, :now, :now)"
            ), {"id": reviewer_id, "name": "Jane Reviewer", "email": "reviewer@invoicetool.com", "pw": hashed, "now": utcnow()})
            await db.commit()
            print("[OK] Created reviewer@invoicetool.com / reviewer123")
        else:
            reviewer_id = reviewer[0]
            print(f"[OK] Reviewer already exists: {reviewer_id}")

        # ── 3. Risk rules ──────────────────────────────────────────────────────
        result = await db.execute(text("SELECT COUNT(*) FROM risk_rules"))
        if result.scalar() == 0:
            rules = [
                ("HIGH_AMOUNT",         "High Amount",         "Invoice exceeds high-value threshold",                "HIGH",   True),
                ("DUPLICATE_INVOICE",   "Duplicate Invoice",   "Invoice number already exists for this vendor",        "HIGH",   True),
                ("NEW_VENDOR",          "New Vendor",          "Vendor not in approved list",                          "MEDIUM", True),
                ("MISSING_PO",          "Missing PO",          "No matching Purchase Order found",                     "MEDIUM", True),
                ("TAX_MISMATCH",        "Tax Mismatch",        "Calculated tax does not match stated tax",             "HIGH",   True),
                ("PAST_DUE_DATE",       "Past Due Date",       "Invoice due date is in the past",                      "LOW",    True),
                ("ROUND_NUMBER_AMOUNT", "Round Number Amount", "Total amount is suspiciously round",                   "LOW",    False),
                ("CURRENCY_MISMATCH",   "Currency Mismatch",   "Currency does not match vendor default",               "MEDIUM", True),
            ]
            for code, name, desc, severity, active in rules:
                await db.execute(text(
                    "INSERT INTO risk_rules (id, rule_code, name, description, severity, is_active, created_at, updated_at) "
                    "VALUES (:id, :code, :name, :desc, :severity, :active, :now, :now) ON CONFLICT DO NOTHING"
                ), {"id": uuid.uuid4(), "code": code, "name": name, "desc": desc, "severity": severity, "active": active, "now": utcnow()})
            await db.commit()
            print("[OK] Seeded 8 risk rules")
        else:
            print("[OK] Risk rules already exist")

        # ── 4. Vendors (vendors.risk_level only allows LOW/MEDIUM/HIGH/UNKNOWN) ─
        vendors_data = [
            ("TechCorp Systems",    "TC-TAX-001", True,  "LOW"),
            ("Global Supplies Inc", "GS-TAX-002", True,  "MEDIUM"),
            ("Apex Consulting LLC", "AC-TAX-003", False, "HIGH"),
            ("Office Solutions Ltd","OS-TAX-004", True,  "LOW"),
            ("Cloud Hosting Pro",   "CH-TAX-005", True,  "LOW"),
            ("Unknown Vendor Co",   None,         False, "UNKNOWN"),
        ]
        vendor_ids = {}
        for name, tax_id, approved, risk in vendors_data:
            result = await db.execute(text("SELECT id FROM vendors WHERE name = :name"), {"name": name})
            existing = result.fetchone()
            if not existing:
                vid = uuid.uuid4()
                await db.execute(text(
                    "INSERT INTO vendors (id, name, tax_id, is_approved, risk_level, created_at, updated_at) "
                    "VALUES (:id, :name, :tax_id, :approved, :risk, :now, :now)"
                ), {"id": vid, "name": name, "tax_id": tax_id, "approved": approved, "risk": risk, "now": utcnow()})
                vendor_ids[name] = vid
                print(f"  [OK] Vendor: {name}")
            else:
                vendor_ids[name] = existing[0]
        await db.commit()

        # ── 5. Invoices ────────────────────────────────────────────────────────
        invoices_data = [
            {"ref": "IDT-2026-06-0001", "vendor": "TechCorp Systems",    "status": "APPROVED",      "amount": Decimal("15420.50"), "inv_num": "INV-TC-2026-001", "ago": 10},
            {"ref": "IDT-2026-06-0002", "vendor": "Global Supplies Inc",  "status": "UNDER_REVIEW",  "amount": Decimal("3200.00"),  "inv_num": "INV-GS-2026-055", "ago": 5},
            {"ref": "IDT-2026-06-0003", "vendor": "Apex Consulting LLC",  "status": "UNDER_REVIEW",  "amount": Decimal("75000.00"), "inv_num": "INV-AC-2026-009", "ago": 3},
            {"ref": "IDT-2026-06-0004", "vendor": "Office Solutions Ltd", "status": "EXTRACTED",     "amount": Decimal("850.75"),   "inv_num": "INV-OS-2026-112", "ago": 2},
            {"ref": "IDT-2026-06-0005", "vendor": "Cloud Hosting Pro",    "status": "REJECTED",      "amount": Decimal("5500.00"),  "inv_num": "INV-CH-2026-033", "ago": 7},
            {"ref": "IDT-2026-06-0006", "vendor": "Unknown Vendor Co",    "status": "PENDING",       "amount": Decimal("12000.00"), "inv_num": "INV-UV-2026-001", "ago": 1},
            {"ref": "IDT-2026-06-0007", "vendor": "TechCorp Systems",     "status": "APPROVED",      "amount": Decimal("8900.00"),  "inv_num": "INV-TC-2026-002", "ago": 15},
            {"ref": "IDT-2026-06-0008", "vendor": "Global Supplies Inc",  "status": "ON_HOLD",       "amount": Decimal("52000.00"), "inv_num": "INV-GS-2026-077", "ago": 4},
        ]
        invoice_ids = {}
        for inv in invoices_data:
            result = await db.execute(text("SELECT id FROM invoices WHERE system_reference = :ref"), {"ref": inv["ref"]})
            existing = result.fetchone()
            if not existing:
                iid = uuid.uuid4()
                vid = vendor_ids.get(inv["vendor"])
                created = days_ago(inv["ago"])
                inv_date = days_ago(inv["ago"] + 5).date()
                due_date = (datetime.now(timezone.utc) + timedelta(days=30 - inv["ago"])).date()
                await db.execute(text(
                    "INSERT INTO invoices (id, system_reference, status, vendor_id, vendor_name_raw, "
                    "vendor_invoice_number, total_amount, currency, invoice_date, due_date, "
                    "file_path, file_name, uploaded_by, created_at, updated_at) "
                    "VALUES (:id, :ref, :status, :vendor_id, :vendor_name, :inv_num, :amount, 'USD', "
                    ":inv_date, :due_date, :file_path, :file_name, :uploader, :created, :created)"
                ), {
                    "id": iid, "ref": inv["ref"], "status": inv["status"],
                    "vendor_id": vid, "vendor_name": inv["vendor"],
                    "inv_num": inv["inv_num"], "amount": inv["amount"],
                    "inv_date": inv_date, "due_date": due_date,
                    "file_path": f"invoices/sample_{inv['ref']}.pdf",
                    "file_name": f"invoice_{inv['ref']}.pdf",
                    "uploader": admin_id, "created": created,
                })
                invoice_ids[inv["ref"]] = iid
                print(f"  [OK] Invoice: {inv['ref']} [{inv['status']}]")
            else:
                invoice_ids[inv["ref"]] = existing[0]
        await db.commit()

        # ── 6. OCR Extractions ─────────────────────────────────────────────────
        ocr_invoices = ["IDT-2026-06-0001", "IDT-2026-06-0002", "IDT-2026-06-0003", "IDT-2026-06-0007", "IDT-2026-06-0008"]
        for ref in ocr_invoices:
            iid = invoice_ids.get(ref)
            if not iid:
                continue
            result = await db.execute(text("SELECT id FROM ocr_extractions WHERE invoice_id = :iid"), {"iid": iid})
            if result.fetchone():
                continue
            inv = next(i for i in invoices_data if i["ref"] == ref)
            fields = json.dumps({
                "vendor_name": inv["vendor"],
                "invoice_number": inv["inv_num"],
                "total_amount": float(inv["amount"]),
                "currency": "USD"
            })
            # Use cast in Python, pass as text parameter
            await db.execute(text(
                "INSERT INTO ocr_extractions (id, invoice_id, extracted_fields, confidence_score, "
                "model_used, status, extracted_at, updated_at) "
                "VALUES (:id, :inv_id, CAST(:fields AS jsonb), :confidence, "
                "'gpt-4o', 'COMPLETED', :now, :now)"
            ), {
                "id": uuid.uuid4(), "inv_id": iid, "fields": fields,
                "confidence": 0.94, "now": utcnow(),
            })
            print(f"  [OK] OCR extraction: {ref}")
        await db.commit()

        # ── 7. Risk Assessments ────────────────────────────────────────────────
        # risk_assessments.overall_risk allows: LOW, MEDIUM, HIGH, CRITICAL
        risk_data = {
            "IDT-2026-06-0001": ("LOW",      []),
            "IDT-2026-06-0002": ("MEDIUM",   [{"rule_name": "NEW_VENDOR", "description": "Vendor not fully approved", "severity": "MEDIUM"}]),
            "IDT-2026-06-0003": ("HIGH",     [
                {"rule_name": "HIGH_AMOUNT", "description": "Invoice exceeds $50,000 threshold", "severity": "HIGH"},
                {"rule_name": "NEW_VENDOR",  "description": "Apex Consulting not in approved vendor list", "severity": "MEDIUM"},
            ]),
            "IDT-2026-06-0005": ("CRITICAL", [
                {"rule_name": "TAX_MISMATCH",      "description": "Tax does not reconcile with line items", "severity": "HIGH"},
                {"rule_name": "DUPLICATE_INVOICE", "description": "Invoice number INV-CH-2026-033 already seen", "severity": "CRITICAL"},
            ]),
            "IDT-2026-06-0006": ("CRITICAL", [
                {"rule_name": "NEW_VENDOR", "description": "Vendor unknown, not in system", "severity": "HIGH"},
                {"rule_name": "MISSING_PO", "description": "No purchase order reference found", "severity": "HIGH"},
            ]),
            "IDT-2026-06-0008": ("HIGH",     [{"rule_name": "HIGH_AMOUNT", "description": "Invoice exceeds $50,000 threshold", "severity": "HIGH"}]),
            "IDT-2026-06-0007": ("LOW",      []),
        }
        score_map = {"LOW": 2, "MEDIUM": 5, "HIGH": 7, "CRITICAL": 9}
        for ref, (risk_level, flags) in risk_data.items():
            iid = invoice_ids.get(ref)
            if not iid:
                continue
            result = await db.execute(text("SELECT id FROM risk_assessments WHERE invoice_id = :iid"), {"iid": iid})
            if result.fetchone():
                continue
            await db.execute(text(
                "INSERT INTO risk_assessments (id, invoice_id, overall_risk, flags, risk_score, assessed_at) "
                "VALUES (:id, :inv_id, :risk, CAST(:flags AS jsonb), :score, :now)"
            ), {
                "id": uuid.uuid4(), "inv_id": iid, "risk": risk_level,
                "flags": json.dumps(flags), "score": score_map[risk_level], "now": utcnow(),
            })
            print(f"  [OK] Risk assessment: {ref} [{risk_level}]")
        await db.commit()

        # ── 8. Comments ────────────────────────────────────────────────────────
        comments_data = [
            ("IDT-2026-06-0002", admin_id,    "Please verify vendor approval status before proceeding."),
            ("IDT-2026-06-0003", reviewer_id, "Requested additional documentation from vendor for high-value invoice."),
            ("IDT-2026-06-0003", admin_id,    "On hold pending legal review."),
            ("IDT-2026-06-0005", admin_id,    "Rejected due to duplicate invoice number."),
        ]
        for ref, uid, comment_text in comments_data:
            iid = invoice_ids.get(ref)
            if not iid:
                continue
            result = await db.execute(text(
                "SELECT id FROM invoice_comments WHERE invoice_id = :iid AND comment = :text"
            ), {"iid": iid, "text": comment_text})
            if result.fetchone():
                continue
            await db.execute(text(
                "INSERT INTO invoice_comments (id, invoice_id, user_id, comment, is_internal, created_at, updated_at) "
                "VALUES (:id, :iid, :uid, :text, false, :now, :now)"
            ), {"id": uuid.uuid4(), "iid": iid, "uid": uid, "text": comment_text, "now": utcnow()})
            print(f"  [OK] Comment on: {ref}")
        await db.commit()

        # ── 9. Audit logs ──────────────────────────────────────────────────────
        audit_data = [
            ("IDT-2026-06-0001", admin_id, "APPROVE", "Approved after thorough review."),
            ("IDT-2026-06-0005", admin_id, "REJECT",  "Rejected: duplicate invoice detected."),
            ("IDT-2026-06-0007", admin_id, "APPROVE", "Standard approval."),
        ]
        for ref, uid, action, reason in audit_data:
            iid = invoice_ids.get(ref)
            if not iid:
                continue
            result = await db.execute(text(
                "SELECT id FROM audit_logs WHERE invoice_id = :iid AND action = :action"
            ), {"iid": iid, "action": action})
            if result.fetchone():
                continue
            await db.execute(text(
                "INSERT INTO audit_logs (id, invoice_id, user_id, action, payload, created_at) "
                "VALUES (:id, :iid, :uid, :action, CAST(:payload AS jsonb), :now)"
            ), {"id": uuid.uuid4(), "iid": iid, "uid": uid, "action": action,
                "payload": json.dumps({"reason": reason}), "now": utcnow()})
            print(f"  [OK] Audit log: {ref} [{action}]")
        await db.commit()

        # ── Summary ────────────────────────────────────────────────────────────
        print("\nSeed complete! Invoice summary:")
        result = await db.execute(text("SELECT status, COUNT(*) FROM invoices GROUP BY status ORDER BY status"))
        for row in result.fetchall():
            print(f"   {row[0]:15s}: {row[1]}")

        print("\nTest accounts:")
        print("   admin@invoicetool.com    / admin123  (ADMIN)")
        print("   reviewer@invoicetool.com / reviewer123 (REVIEWER)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
