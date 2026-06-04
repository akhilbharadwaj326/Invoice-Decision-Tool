"""
services/storage_service.py
===========================
Handles file uploads. 
If SUPABASE_URL and SUPABASE_SERVICE_KEY are set, uploads to Supabase Storage.
Otherwise, falls back to saving files locally in `backend/uploads/`.
"""

import os
import tempfile
import uuid
import aiofiles
from fastapi import HTTPException, UploadFile

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
    file_bytes = await file.read()
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit.",
        )

    if supabase_client:
        # Upload to Supabase Storage
        supabase_client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        return filename
    else:
        # Fallback: Save locally
        file_path = os.path.join(LOCAL_UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(file_bytes)
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
    
    local_path = file_path.replace("\\", "/")
    return f"{settings.BACKEND_PUBLIC_URL.rstrip('/')}/{local_path}"


async def materialize_file(file_path: str) -> tuple[str, str | None]:
    """
    Returns a local filesystem path for OCR. Supabase objects are downloaded
    to a temporary file; local fallback paths are returned unchanged.
    """
    if os.path.exists(file_path):
        return file_path, None

    if not supabase_client:
        raise FileNotFoundError(f"File {file_path} not found locally.")

    file_bytes = supabase_client.storage.from_(settings.SUPABASE_BUCKET).download(file_path)
    suffix = os.path.splitext(file_path)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        return tmp.name, tmp.name
