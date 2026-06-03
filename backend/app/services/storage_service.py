"""
services/storage_service.py
===========================
Handles file uploads. 
If SUPABASE_URL and SUPABASE_SERVICE_KEY are set, uploads to Supabase Storage.
Otherwise, falls back to saving files locally in `backend/uploads/`.
"""

import os
import uuid
import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings

settings = get_settings()

LOCAL_UPLOAD_DIR = "uploads"

# Ensure local upload dir exists
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

# Try initializing Supabase client
supabase_client = None
if settings.has_supabase:
    try:
        from supabase import create_client, Client
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")


async def upload_file(file: UploadFile, invoice_id: uuid.UUID) -> str:
    """
    Uploads a file and returns the file_path/identifier.
    """
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "pdf"
    filename = f"{invoice_id}.{ext}"

    if supabase_client:
        # Upload to Supabase Storage
        file_bytes = await file.read()
        res = supabase_client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        return filename
    else:
        # Fallback: Save locally
        file_path = os.path.join(LOCAL_UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        return file_path


async def get_file_url(file_path: str) -> str:
    """
    Returns a signed URL for Supabase, or just the file path for local fallback.
    """
    if supabase_client and not file_path.startswith(LOCAL_UPLOAD_DIR):
        res = supabase_client.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
            path=file_path,
            expires_in=settings.SUPABASE_SIGNED_URL_EXPIRY
        )
        return res.get("signedURL", "")
    
    # For local fallback, we could serve static files via FastAPI in a real scenario
    # or just return the local file path
    return file_path
