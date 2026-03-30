"""Job applications."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user
from app.deps import get_application_service
from app.schemas.job import ApplyBody
from app.services.application_service import ApplicationService

router = APIRouter(tags=["Applications"])


@router.post("/jobs/{job_id}/applications", status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    body: ApplyBody,
    user: dict = Depends(get_current_user),
    svc: ApplicationService = Depends(get_application_service),
):
    res = await svc.apply(user["id"], job_id, body.cover_letter)
    if not res.get("ok"):
        code = {
            "job_not_found_or_inactive": status.HTTP_404_NOT_FOUND,
            "cannot_apply_own_company": status.HTTP_400_BAD_REQUEST,
            "already_applied": status.HTTP_409_CONFLICT,
            "duplicate": status.HTTP_409_CONFLICT,
        }.get(res.get("error", ""), status.HTTP_400_BAD_REQUEST)
        raise HTTPException(code, detail=res.get("error"))
    return {"id": res["id"]}


@router.get("/applications")
async def list_applications(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
    svc: ApplicationService = Depends(get_application_service),
):
    items, total = await svc.list_mine(user["id"], status_filter, page, page_size)
    counts = await svc.counts_by_status(user["id"])
    return {
        "results": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "counts": counts,
    }


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_application(
    application_id: int,
    user: dict = Depends(get_current_user),
    svc: ApplicationService = Depends(get_application_service),
):
    ok = await svc.withdraw(user["id"], application_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidatura não encontrada")
