"""
api/router.py
=============
Aggregates all API routers into a single router.
"""

from fastapi import APIRouter

from app.api import auth
from app.api import invoices
from app.api import decisions
from app.api import comments
from app.api import admin
from app.api import reports
from app.api import extraction

api_router = APIRouter()

# Mount sub-routers
api_router.include_router(auth.router)
api_router.include_router(invoices.router)
api_router.include_router(decisions.router)
api_router.include_router(comments.router)
api_router.include_router(admin.router)
api_router.include_router(reports.router)
api_router.include_router(extraction.router)
# from app.api import extraction, decisions, comments, reports, admin
# api_router.include_router(extraction.router)
# api_router.include_router(decisions.router)
# api_router.include_router(comments.router)
# api_router.include_router(reports.router)
# api_router.include_router(admin.router)
