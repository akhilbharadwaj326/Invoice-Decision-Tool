"""
services/risk_service.py
========================
Evaluates the invoice for risks (anomalies, missing data, threshold breaches)
and uses GPT-4o to write a summary/recommendation.
"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.models import Invoice, RiskAssessment
from openai import AsyncOpenAI
import json

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def evaluate_rules(invoice: Invoice) -> tuple[int, list[str]]:
    """
    Evaluates hardcoded rules. Returns (risk_score, flags).
    Risk score: 0-10 (0=safe, 10=extreme risk).
    """
    score = 0
    flags = []

    # 1. High Amount Rule
    if invoice.total_amount and float(invoice.total_amount) > settings.RISK_AMOUNT_THRESHOLD:
        score += 4.0
        flags.append(f"High Amount: Total > {settings.RISK_AMOUNT_THRESHOLD}")

    # 2. Missing Tax Rate/Amount
    if invoice.tax_amount is None or float(invoice.tax_amount) == 0:
        score += 2.0
        flags.append("Missing Tax Amount")

    # 3. Arithmetic Mismatch
    if invoice.subtotal and invoice.tax_amount and invoice.total_amount:
        calculated = float(invoice.subtotal) + float(invoice.tax_amount)
        if abs(calculated - float(invoice.total_amount)) > 1.0: # allow 1.0 tolerance for rounding
            score += 5.0
            flags.append("Arithmetic Mismatch: Subtotal + Tax != Total")

    # 4. Unknown Vendor
    if not invoice.vendor_id:
        score += 3.0
        flags.append("Unknown Vendor: No matching vendor found in database")

    # Cap at 10
    score = min(score, 10.0)
    return score, flags


async def generate_ai_summary(invoice: Invoice, flags: list[str]) -> tuple[str, str]:
    """Uses GPT-4o to generate a summary and recommendation based on the data."""
    
    prompt = f"""
    You are an AI Invoice Risk Assessor.
    
    Invoice Details:
    - Vendor: {invoice.vendor_name_raw}
    - Total: {invoice.total_amount} {invoice.currency}
    - Rule Flags triggered: {', '.join(flags) if flags else 'None'}
    
    Provide a JSON response with two keys:
    1. 'ai_summary': A 1-2 sentence explanation of the risk profile.
    2. 'recommendation': "APPROVE", "REVIEW", or "DECLINE".
    """
    
    try:
        completion = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(completion.choices[0].message.content)
        return result.get("ai_summary", "Summary unavailable."), result.get("recommendation", "REVIEW")
        
    except Exception as e:
        print(f"Failed to generate AI summary: {e}")
        return "Failed to generate AI risk summary.", "REVIEW"


async def process_invoice_risk(invoice_id: uuid.UUID, db: AsyncSession) -> None:
    """
    Evaluates the invoice, creates RiskAssessment, updates Invoice status.
    Expected to be called right after OCR completes.
    """
    # Fetch invoice with line items
    result = await db.execute(
        select(Invoice).options(selectinload(Invoice.line_items)).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        return
        
    # 1. Hardcoded Rules
    risk_score, flags = await evaluate_rules(invoice)
    
    overall_risk = "LOW"
    if risk_score >= 7.0:
        overall_risk = "HIGH"
    elif risk_score >= 3.0:
        overall_risk = "MEDIUM"
        
    # 2. LLM Summary
    ai_summary, recommendation = await generate_ai_summary(invoice, flags)
    
    # 3. Create Assessment Record
    assessment = RiskAssessment(
        invoice_id=invoice.id,
        overall_risk=overall_risk,
        risk_score=risk_score,
        ai_summary=ai_summary,
        recommendation=recommendation,
        flags=flags
    )
    db.add(assessment)
    
    # 4. We can optionally auto-approve/reject based on settings, 
    # but the standard flow is to just keep it PENDING_REVIEW 
    # and let the human decide based on the recommendation.
    # However, if it's completely safe, we could auto-approve.
    # We will just leave it as PENDING_REVIEW for now.
    
    await db.commit()
