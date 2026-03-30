"""Dashboard helpers (recommended jobs)."""

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.deps import get_job_service
from app.services.job_service import JobService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/recommended-jobs")
async def recommended_jobs(
    user: dict = Depends(get_current_user),
    svc: JobService = Depends(get_job_service),
):
    jobs = await svc.recommended_for_user(user["id"], limit=3)
    return {"jobs": jobs}
