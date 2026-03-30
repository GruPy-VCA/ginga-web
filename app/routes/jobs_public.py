"""Public job listing and detail."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user_optional
from app.deps import get_job_service
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("")
async def list_jobs(
    q: str | None = Query(None),
    tag: str | None = Query(None),
    company_id: int | None = Query(None, ge=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    sort: str = Query(
        "recent",
        description=(
            "recent=mais recentes, oldest=mais antigas, "
            "recommended=recomendadas (skills vs requisitos)"
        ),
        pattern="^(recent|oldest|recommended)$",
    ),
    user: dict | None = Depends(get_current_user_optional),
    svc: JobService = Depends(get_job_service),
):
    viewer = user["id"] if user else None
    items, total = await svc.list_public(
        q,
        tag,
        page,
        page_size,
        sort=sort,
        viewer_id=viewer,
        company_id=company_id,
    )
    return {"results": items, "total": total, "page": page, "page_size": page_size}


@router.get("/{job_id}")
async def job_detail(
    job_id: int,
    user: dict | None = Depends(get_current_user_optional),
    svc: JobService = Depends(get_job_service),
):
    viewer = user["id"] if user else None
    data = await svc.get_detail(job_id, viewer)
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vaga não encontrada")
    return data
