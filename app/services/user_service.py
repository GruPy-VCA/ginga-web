"""User and profile business logic."""

import re
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.jwt import normalize_cognito_sub
from app.database.models import (
    Education,
    ProfessionalExperience,
    Profile,
    TechProject,
    User,
)


class ProfileSlugTakenError(Exception):
    """Outro perfil já usa este identificador na URL."""


class InvalidProfileSlugError(Exception):
    """Texto inválido para o slug público do perfil."""


MAX_PUBLIC_SLUG_LEN = 200

def _slugify(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "user"


def _canonical_slug_value(s: str | None) -> str:
    """Comparação estável entre slug salvo e valor do formulário."""
    if not s or not str(s).strip():
        return ""
    return _slugify(str(s))


def _public_slug_from_handle(raw: str) -> str:
    """Converte o valor do formulário no slug armazenado (único na URL)."""
    text = (raw or "").strip()
    if not text:
        raise InvalidProfileSlugError(
            "Informe o identificador público do perfil (usado na URL)."
        )
    alnum = re.sub(r"[^a-z0-9]", "", text.lower())
    if len(alnum) < 3:
        raise InvalidProfileSlugError(
            "Use pelo menos 3 letras ou números no identificador da URL."
        )
    slug = _slugify(text)
    if len(slug) < 3:
        raise InvalidProfileSlugError(
            "Use pelo menos 3 caracteres (letras ou números) no identificador da URL."
        )
    if len(slug) > MAX_PUBLIC_SLUG_LEN:
        raise InvalidProfileSlugError("Identificador público é longo demais.")
    return slug


def _is_profile_complete(user: User, profile: Profile | None) -> bool:
    """Nome, sobrenome e slug público (username espelha o slug) obrigatórios."""
    slug_ok = bool((profile and (profile.slug or "").strip()) or (user.username or "").strip())
    return bool(
        (user.first_name or "").strip()
        and (user.last_name or "").strip()
        and slug_ok
    )


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def ensure_user(
        self,
        sub: str,
        email: str,
        first_name: str = "",
        last_name: str = "",
    ) -> User:
        """Garante linha em api_users (id = sub Cognito). Não grava cognito:username:
        o @handle da plataforma é só definido em PATCH /api/v1/me (perfil interno)."""
        sub = normalize_cognito_sub(sub)
        result = await self.session.execute(select(User).where(User.id == sub))
        user = result.scalar_one_or_none()
        if user:
            user.email = email or user.email
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
            await self.session.flush()
            return user

        user = User(
            id=sub,
            email=email or f"{sub}@users.invalid",
            first_name=first_name,
            last_name=last_name,
            username=None,
        )
        self.session.add(user)
        await self.session.flush()

        await self._create_profile_with_auto_slug(user)
        return user

    async def get_me(self, sub: str) -> dict[str, Any] | None:
        sub = normalize_cognito_sub(sub)
        result = await self.session.execute(
            select(User)
            .options(
                selectinload(User.profile).selectinload(Profile.experiences),
                selectinload(User.profile).selectinload(Profile.education_rows),
                selectinload(User.profile).selectinload(Profile.tech_projects),
            )
            .where(User.id == sub)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None
        return self._serialize_user(user)

    def _serialize_user(self, user: User) -> dict[str, Any]:
        p = user.profile
        public_id = (p.slug if p else None) or user.username
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": public_id,
            "is_profile_complete": _is_profile_complete(user, p),
            "is_active": user.is_active,
            "legacy_user_id": user.legacy_user_id,
            "profile": None
            if not p
            else {
                "bio": p.bio,
                "avatar_s3_key": p.avatar_s3_key,
                "city": p.city,
                "contact_info": p.contact_info,
                "skills": p.skills,
                "github_url": p.github_url,
                "linkedin_url": p.linkedin_url,
                "is_portfolio_public": p.is_portfolio_public,
                "is_published": p.is_published,
                "slug": p.slug,
                "experiences": [
                    {
                        "id": e.id,
                        "company": e.company,
                        "role": e.role,
                        "start_date": e.start_date.isoformat(),
                        "end_date": e.end_date.isoformat() if e.end_date else None,
                        "description": e.description,
                    }
                    for e in (p.experiences or [])
                ],
                "education": [
                    {
                        "id": ed.id,
                        "institution": ed.institution,
                        "course": ed.course,
                        "status": ed.status,
                        "start_date": ed.start_date.isoformat() if ed.start_date else None,
                        "end_date": ed.end_date.isoformat() if ed.end_date else None,
                    }
                    for ed in (p.education_rows or [])
                ],
                "tech_projects": [
                    {
                        "id": tp.id,
                        "name": tp.name,
                        "description": tp.description,
                        "url": tp.url,
                        "project_type": tp.project_type,
                    }
                    for tp in (p.tech_projects or [])
                ],
            },
        }

    async def _get_profile_by_user_id(self, uid: str) -> Profile | None:
        uid = normalize_cognito_sub(uid)
        r = await self.session.execute(select(Profile).where(Profile.user_id == uid))
        return r.scalar_one_or_none()

    async def _assert_slug_allows_user(self, sub: str, new_slug: str) -> None:
        """Erro se `new_slug` já estiver em uso por outro user_id; ok se for o mesmo usuário."""
        r = await self.session.execute(select(Profile).where(Profile.slug == new_slug))
        row = r.scalar_one_or_none()
        if row is not None and normalize_cognito_sub(str(row.user_id)) != sub:
            raise ProfileSlugTakenError(
                "Este identificador de URL já está em uso. Escolha outro.",
            )

    async def _assert_username_column_free_for_sub(self, sub: str, desired: str) -> None:
        """api_users.username é UNIQUE: outro id não pode usar o mesmo valor."""
        desired = (desired or "").strip().lower()
        if not desired:
            return
        r = await self.session.execute(
            select(User.id).where(
                User.id != sub,
                User.username.isnot(None),
                func.lower(User.username) == desired,
            ).limit(1)
        )
        if r.scalar_one_or_none() is not None:
            raise ProfileSlugTakenError(
                "Este identificador já está em uso em outra conta. Escolha outro.",
            )

    async def _align_user_username_to_profile_slug(
        self, user: User, p: Profile, sub: str
    ) -> None:
        """Espelha api_users.username no slug do perfil quando vazio/desalinhado, se seguro."""
        slug = _canonical_slug_value(p.slug)
        if not slug:
            return
        cur = (user.username or "").strip().lower()
        if cur == slug:
            return
        await self._assert_username_column_free_for_sub(sub, slug)
        user.username = slug

    async def _create_profile_with_auto_slug(self, user: User) -> Profile:
        """INSERT em api_profiles; slug derivado de email/sub."""
        uid = normalize_cognito_sub(str(user.id))
        base_slug = _slugify(user.username or user.email.split("@")[0] or uid)
        slug = base_slug
        n = 0

        for _ in range(64):
            while True:
                q = await self.session.execute(select(Profile).where(Profile.slug == slug))
                if q.scalar_one_or_none() is None:
                    break
                n += 1
                slug = f"{base_slug}-{n}"

            stmt = (
                pg_insert(Profile.__table__)
                .values(
                    user_id=uid,
                    slug=slug,
                    bio="",
                    city="",
                    contact_info="",
                    skills="",
                    github_url="",
                    linkedin_url="",
                    is_portfolio_public=False,
                    is_published=False,
                    avatar_s3_key=None,
                )
                .on_conflict_do_nothing(constraint="api_profiles_pkey")
            )
            try:
                async with self.session.begin_nested():
                    await self.session.execute(stmt)
                    await self.session.flush()
            except IntegrityError:
                n += 1
                slug = f"{base_slug}-{n}"
                continue

            r2 = await self.session.execute(select(Profile).where(Profile.user_id == uid))
            prof = r2.scalar_one_or_none()
            if prof is not None:
                return prof

        raise RuntimeError("Não foi possível criar o perfil: esgotadas tentativas de slug.")

    async def update_me(self, sub: str, data: dict[str, Any]) -> dict[str, Any] | None:
        sub = normalize_cognito_sub(sub)
        result = await self.session.execute(select(User).where(User.id == sub))
        user = result.scalar_one_or_none()
        if not user:
            return None

        if "first_name" in data:
            user.first_name = data["first_name"] or ""
        if "last_name" in data:
            user.last_name = data["last_name"] or ""

        profile_data = data.get("profile")
        wants_username = "username" in data
        wants_profile_fields = profile_data is not None

        if not wants_username and not wants_profile_fields:
            await self.session.flush()
            return await self.get_me(sub)

        p = await self._get_profile_by_user_id(sub)

        new_slug: str | None = None
        if wants_username:
            new_slug = _public_slug_from_handle(str(data["username"]))

        if p is None:
            if new_slug is not None:
                await self._assert_slug_allows_user(sub, new_slug)
                await self._assert_username_column_free_for_sub(sub, new_slug)
                p = Profile(
                    user_id=sub,
                    slug=new_slug,
                    bio="",
                    city="",
                    contact_info="",
                    skills="",
                    github_url="",
                    linkedin_url="",
                    is_portfolio_public=False,
                    is_published=False,
                    avatar_s3_key=None,
                )
                self.session.add(p)
                user.username = new_slug
            else:
                p = await self._create_profile_with_auto_slug(user)
        else:
            if new_slug is not None:
                cur_slug = _canonical_slug_value(p.slug)
                if new_slug != cur_slug:
                    await self._assert_slug_allows_user(sub, new_slug)
                    await self._assert_username_column_free_for_sub(sub, new_slug)
                    p.slug = new_slug
                    user.username = new_slug

        if profile_data:
            for key in (
                "bio",
                "city",
                "contact_info",
                "skills",
                "github_url",
                "linkedin_url",
                "is_portfolio_public",
                "is_published",
                "avatar_s3_key",
            ):
                if key in profile_data:
                    setattr(p, key, profile_data[key])

        if p is not None:
            await self._align_user_username_to_profile_slug(user, p, sub)

        await self.session.flush()
        return await self.get_me(sub)

    async def add_experience(self, sub: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        user = await self._require_profile_user(sub)
        if not user:
            return None
        from datetime import date as date_cls

        exp = ProfessionalExperience(
            profile_user_id=user.profile.user_id,
            company=payload["company"],
            role=payload["role"],
            start_date=date_cls.fromisoformat(payload["start_date"]),
            end_date=date_cls.fromisoformat(payload["end_date"])
            if payload.get("end_date")
            else None,
            description=payload.get("description", ""),
        )
        self.session.add(exp)
        await self.session.flush()
        return {"id": exp.id}

    async def update_experience(
        self, sub: str, exp_id: int, payload: dict[str, Any]
    ) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        from datetime import date as date_cls

        result = await self.session.execute(
            select(ProfessionalExperience).where(
                ProfessionalExperience.id == exp_id,
                ProfessionalExperience.profile_user_id == user.id,
            )
        )
        exp = result.scalar_one_or_none()
        if not exp:
            return False
        for k, v in payload.items():
            if k == "start_date" and v:
                exp.start_date = date_cls.fromisoformat(v)
            elif k == "end_date":
                exp.end_date = date_cls.fromisoformat(v) if v else None
            elif hasattr(exp, k) and k not in ("id", "profile_user_id"):
                setattr(exp, k, v)
        await self.session.flush()
        return True

    async def delete_experience(self, sub: str, exp_id: int) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        result = await self.session.execute(
            select(ProfessionalExperience).where(
                ProfessionalExperience.id == exp_id,
                ProfessionalExperience.profile_user_id == user.id,
            )
        )
        exp = result.scalar_one_or_none()
        if not exp:
            return False
        await self.session.delete(exp)
        await self.session.flush()
        return True

    async def add_education(self, sub: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        user = await self._require_profile_user(sub)
        if not user:
            return None
        from datetime import date as date_cls

        ed = Education(
            profile_user_id=user.profile.user_id,
            institution=payload["institution"],
            course=payload["course"],
            status=payload.get("status", "in_progress"),
            start_date=date_cls.fromisoformat(payload["start_date"])
            if payload.get("start_date")
            else None,
            end_date=date_cls.fromisoformat(payload["end_date"])
            if payload.get("end_date")
            else None,
        )
        self.session.add(ed)
        await self.session.flush()
        return {"id": ed.id}

    async def update_education(self, sub: str, ed_id: int, payload: dict[str, Any]) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        from datetime import date as date_cls

        result = await self.session.execute(
            select(Education).where(
                Education.id == ed_id,
                Education.profile_user_id == user.id,
            )
        )
        ed = result.scalar_one_or_none()
        if not ed:
            return False
        for k, v in payload.items():
            if k in ("start_date", "end_date"):
                setattr(
                    ed,
                    k,
                    date_cls.fromisoformat(v) if v else None,
                )
            elif hasattr(ed, k) and k not in ("id", "profile_user_id"):
                setattr(ed, k, v)
        await self.session.flush()
        return True

    async def delete_education(self, sub: str, ed_id: int) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        result = await self.session.execute(
            select(Education).where(
                Education.id == ed_id,
                Education.profile_user_id == user.id,
            )
        )
        ed = result.scalar_one_or_none()
        if not ed:
            return False
        await self.session.delete(ed)
        await self.session.flush()
        return True

    async def add_tech_project(self, sub: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        user = await self._require_profile_user(sub)
        if not user:
            return None
        tp = TechProject(
            profile_user_id=user.profile.user_id,
            name=payload["name"],
            description=payload.get("description", ""),
            url=payload.get("url", ""),
            project_type=payload.get("project_type", "open_source"),
        )
        self.session.add(tp)
        await self.session.flush()
        return {"id": tp.id}

    async def update_tech_project(
        self, sub: str, tp_id: int, payload: dict[str, Any]
    ) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        result = await self.session.execute(
            select(TechProject).where(
                TechProject.id == tp_id,
                TechProject.profile_user_id == user.id,
            )
        )
        tp = result.scalar_one_or_none()
        if not tp:
            return False
        for k, v in payload.items():
            if hasattr(tp, k) and k not in ("id", "profile_user_id"):
                setattr(tp, k, v)
        await self.session.flush()
        return True

    async def delete_tech_project(self, sub: str, tp_id: int) -> bool:
        user = await self._require_profile_user(sub)
        if not user:
            return False
        result = await self.session.execute(
            select(TechProject).where(
                TechProject.id == tp_id,
                TechProject.profile_user_id == user.id,
            )
        )
        tp = result.scalar_one_or_none()
        if not tp:
            return False
        await self.session.delete(tp)
        await self.session.flush()
        return True

    async def _require_profile_user(self, sub: str) -> User | None:
        sub = normalize_cognito_sub(sub)
        result = await self.session.execute(
            select(User).options(selectinload(User.profile)).where(User.id == sub)
        )
        user = result.scalar_one_or_none()
        if not user or not user.profile:
            return None
        return user
