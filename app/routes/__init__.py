"""API routers."""

from fastapi import APIRouter

from app.routes import (
    applications,
    companies,
    dashboard,
    jobs_public,
    jobs_recruiter,
    me,
    recruiter_applications,
    tags,
    uploads,
)

api_router = APIRouter()
api_router.include_router(me.router)
api_router.include_router(companies.router)
api_router.include_router(jobs_public.router)
api_router.include_router(jobs_recruiter.router)
api_router.include_router(applications.router)
api_router.include_router(recruiter_applications.router)
api_router.include_router(tags.router)
api_router.include_router(uploads.router)
api_router.include_router(dashboard.router)
