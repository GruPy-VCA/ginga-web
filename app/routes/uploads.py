"""Presigned S3 upload URLs."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user
from app.services.file_service import PRESIGNED_DOWNLOAD_EXPIRY, FileService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


def _download_payload(s3_key: str) -> dict[str, Any]:
    url = FileService.presign_download(s3_key)
    if not url:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Arquivo não encontrado.")
    return {"url": url, "expires_in": PRESIGNED_DOWNLOAD_EXPIRY}


def _is_company_logo_key(s3_key: str) -> bool:
    parts = s3_key.strip().split("/")
    return len(parts) >= 4 and parts[0] == "ginga" and parts[1] == "company_logo"


def _user_owns_s3_key(user_id: str, s3_key: str) -> bool:
    parts = s3_key.strip().split("/")
    if len(parts) < 4 or parts[0] != "ginga":
        return False
    purpose, owner = parts[1], parts[2]
    if purpose not in ("avatar", "company_logo"):
        return False
    return owner == user_id


@router.post("/presign")
async def presign_upload(
    purpose: str = Query(..., description="avatar | company_logo | resume"),
    file_ext: str = Query(..., description="e.g. .png or png"),
    user: dict = Depends(get_current_user),
):
    allow_docs = purpose == "resume"
    if purpose not in ("avatar", "company_logo", "resume"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "purpose inválido")
    out = FileService.presign_upload(
        purpose=purpose,
        owner_id=user["id"],
        file_ext=file_ext,
        allow_documents=allow_docs,
    )
    if "error" in out:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, out["error"])
    return out


@router.get("/view-url")
async def presign_view_url(
    s3_key: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user),
):
    uid = user["id"]
    if not _user_owns_s3_key(uid, s3_key):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para este arquivo.")
    return _download_payload(s3_key)


@router.get("/company-logo-url")
async def company_logo_display_url(s3_key: str = Query(..., min_length=1)):
    if not _is_company_logo_key(s3_key):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Chave inválida.")
    return _download_payload(s3_key)
