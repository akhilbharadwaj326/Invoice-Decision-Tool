"""
services/ocr_service.py
=======================
Extracts structured data from invoices using OpenAI GPT-4o Vision.
Converts PDFs to images via PyMuPDF.
"""

import base64
import os
import uuid
import fitz  # PyMuPDF
from typing import List, Optional
from pydantic import BaseModel, Field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models.models import Invoice, OcrExtraction, Vendor, InvoiceLineItem
from app.services.storage_service import materialize_file
from openai import AsyncOpenAI

settings = get_settings()

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ── Structured Output Models ──────────────────────────────────────────────────

class LineItemSchema(BaseModel):
    description: str
    quantity: float
    unit_price: float
    line_total: float
    hsn_sac_code: Optional[str] = None
    item_code: Optional[str] = None
    tax_rate: Optional[float] = None


class InvoiceExtractionSchema(BaseModel):
    vendor_name: str
    vendor_invoice_number: Optional[str] = None
    invoice_date: Optional[str] = Field(description="YYYY-MM-DD")
    due_date: Optional[str] = Field(description="YYYY-MM-DD")
    currency: str = Field(default="USD", description="ISO currency code")
    subtotal: float
    tax_amount: float
    total_amount: float
    line_items: List[LineItemSchema]


def convert_pdf_to_base64_images(file_path: str) -> List[str]:
    """Convert PDF pages to base64 encoded PNG images."""
    doc = fitz.open(file_path)
    base64_images = []
    
    # Render at 150 DPI
    zoom_matrix = fitz.Matrix(150 / 72, 150 / 72)
    
    for page in doc:
        pix = page.get_pixmap(matrix=zoom_matrix)
        img_bytes = pix.tobytes("png")
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        base64_images.append(b64)
        
    doc.close()
    return base64_images


def get_image_base64(file_path: str) -> List[str]:
    """Read a standard image as base64."""
    with open(file_path, "rb") as f:
        return [base64.b64encode(f.read()).decode("utf-8")]


async def process_invoice_ocr(invoice_id: uuid.UUID, db_session_maker) -> None:
    """
    Background task to run OCR on an invoice.
    Uses its own db session.
    """
    async with db_session_maker() as db:
        result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            return

        try:
            file_path, temp_path = await materialize_file(invoice.file_path)

            # Get base64 images
            if file_path.lower().endswith(".pdf"):
                base64_images = convert_pdf_to_base64_images(file_path)
            else:
                base64_images = get_image_base64(file_path)

            # Build OpenAI messages
            messages = [
                {
                    "role": "system",
                    "content": "You are a highly accurate invoice data extraction assistant. Extract the data exactly as seen."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract the invoice details from the attached document pages."}
                    ]
                }
            ]
            
            for b64 in base64_images:
                messages[1]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{b64}"}
                })

            # Call OpenAI with Structured Outputs
            completion = await client.beta.chat.completions.parse(
                model=settings.OPENAI_MODEL,
                messages=messages,
                response_format=InvoiceExtractionSchema,
                max_tokens=2048,
            )
            
            extracted_data = completion.choices[0].message.parsed
            
            # --- Update DB ---
            
            # 1. Update Invoice status & data
            invoice.status = "UNDER_REVIEW"
            invoice.vendor_name_raw = extracted_data.vendor_name
            invoice.vendor_invoice_number = extracted_data.vendor_invoice_number
            # Date parsing omitted for brevity in POC, assuming raw strings can be converted if needed
            # In a real app we'd parse YYYY-MM-DD strictly
            
            invoice.currency = extracted_data.currency
            invoice.subtotal = extracted_data.subtotal
            invoice.tax_amount = extracted_data.tax_amount
            invoice.total_amount = extracted_data.total_amount
            
            # Create extraction log
            extraction = OcrExtraction(
                invoice_id=invoice.id,
                raw_text="",
                raw_response=completion.model_dump_json(),
                extracted_fields=extracted_data.model_dump(),
                confidence_score=0.95, # Mock confidence for now
                model_used=settings.OPENAI_MODEL,
                tokens_used=completion.usage.total_tokens if completion.usage else 0,
                status="COMPLETED"
            )
            db.add(extraction)
            await db.flush() # flush to get extraction.id
            
            # Create line items
            for idx, item in enumerate(extracted_data.line_items):
                li = InvoiceLineItem(
                    invoice_id=invoice.id,
                    extraction_id=extraction.id,
                    line_number=idx + 1,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    line_total=item.line_total,
                    hsn_sac_code=item.hsn_sac_code,
                    item_code=item.item_code,
                    tax_rate=item.tax_rate
                )
                db.add(li)
                
            await db.commit()
            
            # Trigger Risk Engine (Phase 5 Part 2)
            from app.services.risk_service import process_invoice_risk
            await process_invoice_risk(invoice.id, db)
            
        except Exception as e:
            invoice.status = "REJECTED"
            invoice.invoice_notes = f"OCR Failed: {str(e)}"
            await db.commit()
            print(f"OCR Error for invoice {invoice_id}: {e}")
        finally:
            if "temp_path" in locals() and temp_path:
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass
