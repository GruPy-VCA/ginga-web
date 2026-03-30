"""Companies (recruiter + catálogo público)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user
from app.deps import get_company_service
from app.schemas.company import CompanyCreate, CompanyPatch
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/public")
async def list_public_companies(
    q: str | None = Query(None, description="Busca por nome"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    svc: CompanyService = Depends(get_company_service),
):
    items, total = await svc.list_public(q, page, page_size)
    return {"companies": items, "total": total, "page": page, "page_size": page_size}


@router.get("/public/{company_id}")
async def get_public_company(
    company_id: int,
    svc: CompanyService = Depends(get_company_service),
):
    data = await svc.get_public(company_id)
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    return data


@router.get("/mine")
async def list_my_companies(
    user: dict = Depends(get_current_user),
    svc: CompanyService = Depends(get_company_service),
):
    return {"companies": await svc.list_mine(user["id"])}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate,
    user: dict = Depends(get_current_user),
    svc: CompanyService = Depends(get_company_service),
):
    return await svc.create(user["id"], body.model_dump())


@router.get("/{company_id}")
async def get_company(
    company_id: int,
    user: dict = Depends(get_current_user),
    svc: CompanyService = Depends(get_company_service),
):
    data = await svc.get(company_id, user["id"])
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    return data


@router.patch("/{company_id}")
async def update_company(
    company_id: int,
    body: CompanyPatch,
    user: dict = Depends(get_current_user),
    svc: CompanyService = Depends(get_company_service),
):
    data = await svc.update(company_id, user["id"], body.model_dump(exclude_unset=True))
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
    return data


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: int,
    user: dict = Depends(get_current_user),
    svc: CompanyService = Depends(get_company_service),
):
    ok = await svc.delete(company_id, user["id"])
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Empresa não encontrada")
