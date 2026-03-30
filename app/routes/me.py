"""Current user profile and portfolio."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.auth import get_current_user
from app.config import IS_DEVELOPMENT
from app.deps import get_user_service
from app.schemas.me import (
    EducationCreate,
    EducationPatch,
    ExperienceCreate,
    ExperiencePatch,
    MePatch,
    TechProjectCreate,
    TechProjectPatch,
)
from app.services.user_service import (
    InvalidProfileSlugError,
    ProfileSlugTakenError,
    UserService,
)

router = APIRouter(prefix="/me", tags=["Me"])
logger = logging.getLogger(__name__)


def _http_conflict_from_integrity(exc: IntegrityError) -> HTTPException:
    """Mapeia IntegrityError do Postgres para HTTP 4xx/409."""
    orig = getattr(exc, "orig", None)
    detail = getattr(orig, "detail", None) or ""
    cname = (getattr(orig, "constraint_name", None) or "").lower()
    blob = f"{orig!s} {exc!s} {detail}".lower()

    if "not null" in blob or "notnullviolation" in blob:
        return HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Campo obrigatório do perfil ausente ou inválido. Verifique o formulário.",
        )
    if "api_profiles_pkey" in cname or (
        "duplicate key" in blob and "user_id" in blob and "api_profiles" in blob
    ):
        return HTTPException(
            status.HTTP_409_CONFLICT,
            "O perfil já existe nesta conta. Recarregue a página e salve de novo.",
        )
    # Slug: índice/nome variam (ix_api_profiles_slug, etc.); DETAIL costuma citar (slug)=
    if (
        "ix_api_profiles_slug" in cname
        or "ix_api_profiles_slug" in blob
        or ("(slug)" in blob and "duplicate" in blob)
        or ("key (slug)" in blob)
    ):
        return HTTPException(
            status.HTTP_409_CONFLICT,
            "Este identificador de URL já está em uso. Escolha outro.",
        )
    # Username em api_users: constraint pode vir só no DETAIL
    if (
        "uq_api_users_username" in cname
        or "uq_api_users_username" in blob
        or ("(username)" in blob and "duplicate" in blob)
        or ("key (username)" in blob)
    ):
        return HTTPException(
            status.HTTP_409_CONFLICT,
            "Este identificador já está em uso em outra conta. Escolha outro.",
        )
    pg_detail = (detail or str(orig) or "").strip()
    logger.warning("IntegrityError não mapeado: %s", pg_detail[:600])
    msg = "Não foi possível salvar (conflito de dados). Tente novamente."
    if IS_DEVELOPMENT and pg_detail:
        msg += f" [{pg_detail[:300]}]"
    return HTTPException(status.HTTP_409_CONFLICT, msg)


@router.get("")
async def get_me(
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(
        user["id"],
        user.get("email", ""),
        user.get("given_name", ""),
        user.get("family_name", ""),
    )
    data = await svc.get_me(user["id"])
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")
    return data


@router.post("", status_code=status.HTTP_201_CREATED)
async def register_me(
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(
        user["id"],
        user.get("email", ""),
        user.get("given_name", ""),
        user.get("family_name", ""),
    )
    data = await svc.get_me(user["id"])
    if not data:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Falha ao criar usuário")
    return data


@router.patch("")
async def patch_me(
    body: MePatch,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(
        user["id"],
        user.get("email", ""),
        user.get("given_name", ""),
        user.get("family_name", ""),
    )
    try:
        data = await svc.update_me(user["id"], body.model_dump(exclude_unset=True))
    except ProfileSlugTakenError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, str(e)) from e
    except InvalidProfileSlugError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e)) from e
    except IntegrityError as e:
        raise _http_conflict_from_integrity(e) from e
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuário não encontrado")
    return data


@router.post("/experiences", status_code=status.HTTP_201_CREATED)
async def add_experience(
    body: ExperienceCreate,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(user["id"], user.get("email", ""), "", "")
    out = await svc.add_experience(user["id"], body.model_dump())
    if not out:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Perfil não disponível")
    return out


@router.patch("/experiences/{exp_id}")
async def patch_experience(
    exp_id: int,
    body: ExperiencePatch,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.update_experience(user["id"], exp_id, body.model_dump(exclude_unset=True))
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiência não encontrada")
    return {"ok": True}


@router.delete("/experiences/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    exp_id: int,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.delete_experience(user["id"], exp_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiência não encontrada")


@router.post("/education", status_code=status.HTTP_201_CREATED)
async def add_education(
    body: EducationCreate,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(user["id"], user.get("email", ""), "", "")
    out = await svc.add_education(user["id"], body.model_dump())
    if not out:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Perfil não disponível")
    return out


@router.patch("/education/{ed_id}")
async def patch_education(
    ed_id: int,
    body: EducationPatch,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.update_education(user["id"], ed_id, body.model_dump(exclude_unset=True))
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado")
    return {"ok": True}


@router.delete("/education/{ed_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    ed_id: int,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.delete_education(user["id"], ed_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado")


@router.post("/tech-projects", status_code=status.HTTP_201_CREATED)
async def add_tech_project(
    body: TechProjectCreate,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    await svc.ensure_user(user["id"], user.get("email", ""), "", "")
    out = await svc.add_tech_project(user["id"], body.model_dump())
    if not out:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Perfil não disponível")
    return out


@router.patch("/tech-projects/{tp_id}")
async def patch_tech_project(
    tp_id: int,
    body: TechProjectPatch,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.update_tech_project(user["id"], tp_id, body.model_dump(exclude_unset=True))
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Projeto não encontrado")
    return {"ok": True}


@router.delete("/tech-projects/{tp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tech_project(
    tp_id: int,
    user: dict = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
):
    ok = await svc.delete_tech_project(user["id"], tp_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Projeto não encontrado")
