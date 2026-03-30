"""Company CRUD for owners."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Application, Company, Job


class CompanyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_mine(self, owner_id: str) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(Company)
            .options(selectinload(Company.jobs))
            .where(Company.owner_id == owner_id)
            .order_by(Company.name)
        )
        companies = result.scalars().unique().all()
        out = []
        for c in companies:
            job_rows = []
            for j in c.jobs:
                cnt = await self.session.scalar(
                    select(func.count())
                    .select_from(Application)
                    .where(Application.job_id == j.id)
                )
                job_rows.append(
                    {
                        "id": j.id,
                        "title": j.title,
                        "is_active": j.is_active,
                        "applications_count": int(cnt or 0),
                        "created_at": j.created_at.isoformat() if j.created_at else None,
                    }
                )
            out.append(
                {
                    "id": c.id,
                    "name": c.name,
                    "cnpj": c.cnpj,
                    "website": c.website,
                    "description": c.description,
                    "logo_s3_key": c.logo_s3_key,
                    "jobs": job_rows,
                }
            )
        return out

    async def get(self, company_id: int, owner_id: str) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(Company).where(Company.id == company_id, Company.owner_id == owner_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            return None
        return {
            "id": c.id,
            "name": c.name,
            "cnpj": c.cnpj,
            "website": c.website,
            "description": c.description,
            "logo_s3_key": c.logo_s3_key,
        }

    async def create(self, owner_id: str, data: dict[str, Any]) -> dict[str, Any]:
        c = Company(
            name=data["name"],
            cnpj=data["cnpj"],
            website=data.get("website", ""),
            description=data.get("description", ""),
            logo_s3_key=data.get("logo_s3_key"),
            owner_id=owner_id,
        )
        self.session.add(c)
        await self.session.flush()
        await self.session.refresh(c)
        return {"id": c.id}

    async def update(
        self, company_id: int, owner_id: str, data: dict[str, Any]
    ) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(Company).where(Company.id == company_id, Company.owner_id == owner_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            return None
        for k in ("name", "cnpj", "website", "description", "logo_s3_key"):
            if k not in data:
                continue
            val = data[k]
            if k in ("website", "description") and val is None:
                val = ""
            setattr(c, k, val)
        await self.session.flush()
        return await self.get(company_id, owner_id)

    async def delete(self, company_id: int, owner_id: str) -> bool:
        result = await self.session.execute(
            select(Company).where(Company.id == company_id, Company.owner_id == owner_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            return False
        await self.session.delete(c)
        await self.session.flush()
        return True

    async def owns(self, user_id: str, company_id: int) -> bool:
        result = await self.session.execute(
            select(Company.id).where(Company.id == company_id, Company.owner_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def list_public(
        self,
        q: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict[str, Any]], int]:
        """Catálogo público de empresas (nome, descrição resumida, contagem de vagas ativas)."""
        filters = []
        if q and q.strip():
            filters.append(Company.name.ilike(f"%{q.strip()}%"))
        stmt_count = select(func.count()).select_from(Company)
        if filters:
            stmt_count = stmt_count.where(*filters)
        total = await self.session.scalar(stmt_count)
        stmt = select(Company).order_by(Company.name)
        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        rows = result.scalars().all()
        out: list[dict[str, Any]] = []
        for c in rows:
            active_cnt = await self.session.scalar(
                select(func.count()).select_from(Job).where(
                    Job.company_id == c.id,
                    Job.is_active.is_(True),
                )
            )
            desc = (c.description or "").strip()
            if len(desc) > 280:
                desc = desc[:277] + "…"
            out.append(
                {
                    "id": c.id,
                    "name": c.name,
                    "description_preview": desc,
                    "website": c.website or "",
                    "logo_s3_key": c.logo_s3_key,
                    "active_jobs_count": int(active_cnt or 0),
                }
            )
        return out, int(total or 0)

    async def get_public(self, company_id: int) -> dict[str, Any] | None:
        result = await self.session.execute(select(Company).where(Company.id == company_id))
        c = result.scalar_one_or_none()
        if not c:
            return None
        active_cnt = await self.session.scalar(
            select(func.count()).select_from(Job).where(
                Job.company_id == c.id,
                Job.is_active.is_(True),
            )
        )
        return {
            "id": c.id,
            "name": c.name,
            "description": c.description or "",
            "website": c.website or "",
            "logo_s3_key": c.logo_s3_key,
            "active_jobs_count": int(active_cnt or 0),
        }
