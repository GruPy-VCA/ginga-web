"""Recruiter job management."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.deps import get_job_service
from app.schemas.job import JobCreate, JobPatch
from app.services.job_service import JobService

router = APIRouter(prefix="/recruiter/jobs", tags=["Recruiter Jobs"])


@router.get("")
async def list_recruiter_jobs(
    user: dict = Depends(get_current_user),
    svc: JobService = Depends(get_job_service),
):
    return {"jobs": await svc.list_recruiter(user["id"])}


@router.post("/companies/{company_id}", status_code=status.HTTP_201_CREATED)
async def create_job(
    company_id: int,
    body: JobCreate,
    user: dict = Depends(get_current_user),
    svc: JobService = Depends(get_job_service),
):
    out = await svc.create(
        user["id"],
        company_id,
        body.model_dump(exclude={"tags"}),
        body.tags,
    )
    if not out:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Empresa inválida ou sem permissão")
    return out


@router.patch("/{job_id}")
async def update_job(
    job_id: int,
    body: JobPatch,
    user: dict = Depends(get_current_user),
    svc: JobService = Depends(get_job_service),
):
    payload = body.model_dump(exclude_unset=True)
    tags = payload.pop("tags", None)
    out = await svc.update(user["id"], job_id, payload, tags)
    if not out:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vaga não encontrada")
    return out
