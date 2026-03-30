"""Recruiter inbox for job applications."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user
from app.deps import get_application_service
from app.schemas.job import RecruiterApplicationPatch
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/recruiter/applications", tags=["Recruiter Applications"])


@router.get("")
async def list_recruiter_applications(
    job_id: int | None = Query(None),
    company_id: int | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    svc: ApplicationService = Depends(get_application_service),
):
    items, total = await svc.list_for_recruiter(
        user["id"],
        job_id,
        company_id,
        status_filter,
        page,
        page_size,
    )
    return {
        "results": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{application_id}")
async def patch_recruiter_application(
    application_id: int,
    body: RecruiterApplicationPatch,
    user: dict = Depends(get_current_user),
    svc: ApplicationService = Depends(get_application_service),
):
    out = await svc.recruiter_update_status(
        user["id"],
        application_id,
        body.status,
        body.feedback_text,
    )
    if not out:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidatura não encontrada")
    return out
