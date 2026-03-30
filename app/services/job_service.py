"""Public and recruiter job operations."""

from typing import Any

from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Application, Company, Job, JobTag, Profile, Tag


class JobService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _skills_for_user(self, user_id: str) -> list[str]:
        result = await self.session.execute(select(Profile).where(Profile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile or not profile.skills:
            return []
        return [s.strip().lower() for s in profile.skills.split(",") if s.strip()]

    @staticmethod
    def _job_not_owned_by_user(user_id: str):
        return ~exists().where(and_(Company.id == Job.company_id, Company.owner_id == user_id))

    @staticmethod
    def _requirements_match_skills_clause(skills: list[str]):
        """True se alguma skill do perfil aparece no texto de requirements (case insensitive)."""
        hay = func.coalesce(Job.requirements, "")
        conds: list[Any] = []
        for s in skills:
            needle = s.strip().lower()
            if len(needle) < 1:
                continue
            conds.append(func.strpos(func.lower(hay), needle) > 0)
        if not conds:
            return None
        return or_(*conds)

    async def list_public(
        self,
        q: str | None,
        tag: str | None,
        page: int,
        page_size: int,
        sort: str = "recent",
        viewer_id: str | None = None,
        company_id: int | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        filters: list[Any] = [Job.is_active.is_(True)]
        if company_id is not None:
            filters.append(Job.company_id == company_id)
        if tag:
            tnorm = tag.strip().lower()
            filters.append(
                exists().where(
                    and_(
                        JobTag.job_id == Job.id,
                        Tag.id == JobTag.tag_id,
                        func.lower(Tag.name) == tnorm,
                    )
                )
            )
        if q:
            like = f"%{q}%"
            company_match = exists().where(
                and_(Company.id == Job.company_id, Company.name.ilike(like))
            )
            tag_q = exists().where(
                and_(
                    JobTag.job_id == Job.id,
                    Tag.id == JobTag.tag_id,
                    Tag.name.ilike(like),
                )
            )
            filters.append(
                or_(
                    Job.title.ilike(like),
                    Job.description.ilike(like),
                    company_match,
                    tag_q,
                )
            )

        if sort == "recommended" and viewer_id:
            filters.append(self._job_not_owned_by_user(viewer_id))
            skills = await self._skills_for_user(viewer_id)
            req_match = self._requirements_match_skills_clause(skills)
            if req_match is not None:
                filters.append(req_match)

        if sort == "oldest":
            order = Job.created_at.asc()
        else:
            order = Job.created_at.desc()

        id_stmt = select(Job.id).where(*filters).distinct()
        subq = id_stmt.subquery()
        total = await self.session.scalar(select(func.count()).select_from(subq))

        stmt = (
            select(Job)
            .options(
                selectinload(Job.company),
                selectinload(Job.tags),
            )
            .where(Job.id.in_(select(subq.c.id)))
            .order_by(order)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        jobs = result.scalars().unique().all()
        return [self._job_summary(j) for j in jobs], int(total or 0)

    def _job_summary(self, job: Job) -> dict[str, Any]:
        return {
            "id": job.id,
            "title": job.title,
            "salary_range": job.salary_range,
            "is_active": job.is_active,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "company": {
                "id": job.company.id,
                "name": job.company.name,
                "logo_s3_key": job.company.logo_s3_key,
            },
            "tags": [t.name for t in job.tags],
        }

    async def get_detail(self, job_id: int, viewer_id: str | None) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(Job)
            .options(
                selectinload(Job.company),
                selectinload(Job.tags),
            )
            .where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            return None
        if not job.is_active:
            if not viewer_id:
                return None
            own = await self.session.scalar(
                select(Company.id).where(
                    Company.id == job.company_id,
                    Company.owner_id == viewer_id,
                )
            )
            if not own:
                return None
        return {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "requirements": job.requirements,
            "salary_range": job.salary_range,
            "is_active": job.is_active,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "company": {
                "id": job.company.id,
                "name": job.company.name,
                "website": job.company.website,
                "description": job.company.description,
                "logo_s3_key": job.company.logo_s3_key,
            },
            "tags": [t.name for t in job.tags],
        }

    async def list_recruiter(self, owner_id: str) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(Job)
            .join(Company)
            .options(selectinload(Job.company), selectinload(Job.tags))
            .where(Company.owner_id == owner_id)
            .order_by(Job.created_at.desc())
        )
        jobs = result.scalars().unique().all()
        out = []
        for j in jobs:
            cnt = await self.session.scalar(
                select(func.count())
                .select_from(Application)
                .where(Application.job_id == j.id)
            )
            row = self._job_summary(j)
            row["applications_count"] = int(cnt or 0)
            out.append(row)
        return out

    async def create(
        self,
        owner_id: str,
        company_id: int,
        data: dict[str, Any],
        tag_names: list[str],
    ) -> dict[str, Any] | None:
        own = await self.session.scalar(
            select(Company.id).where(Company.id == company_id, Company.owner_id == owner_id)
        )
        if not own:
            return None
        job = Job(
            company_id=company_id,
            title=data["title"],
            description=data["description"],
            requirements=data.get("requirements", ""),
            salary_range=data.get("salary_range", ""),
            is_active=data.get("is_active", True),
        )
        self.session.add(job)
        await self.session.flush()
        await self._set_tags(job, tag_names)
        await self.session.flush()
        return {"id": job.id}

    async def update(
        self,
        owner_id: str,
        job_id: int,
        data: dict[str, Any],
        tag_names: list[str] | None,
    ) -> dict[str, Any] | None:
        result = await self.session.execute(
            select(Job)
            .join(Company)
            .options(selectinload(Job.tags))
            .where(Job.id == job_id, Company.owner_id == owner_id)
        )
        job = result.scalar_one_or_none()
        if not job:
            return None
        for k in ("title", "description", "requirements", "salary_range", "is_active"):
            if k in data:
                setattr(job, k, data[k])
        if tag_names is not None:
            await self._set_tags(job, tag_names)
        await self.session.flush()
        return await self.get_detail(job_id, owner_id)

    async def _set_tags(self, job: Job, tag_names: list[str]) -> None:
        # Evita lazy load em job.tags (MissingGreenlet com AsyncSession).
        await self.session.refresh(job, attribute_names=["tags"])
        job.tags.clear()
        for raw in tag_names:
            name = raw.strip()
            if not name:
                continue
            result = await self.session.execute(select(Tag).where(Tag.name == name))
            tag = result.scalar_one_or_none()
            if not tag:
                tag = Tag(name=name)
                self.session.add(tag)
                await self.session.flush()
            job.tags.append(tag)

    async def is_owner(self, user_id: str, job_id: int) -> bool:
        result = await self.session.execute(
            select(Job.id)
            .join(Company)
            .where(Job.id == job_id, Company.owner_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def recommended_for_user(self, sub: str, limit: int = 3) -> list[dict[str, Any]]:
        """Skills × requirements; exclui vagas das empresas do próprio usuário."""
        skills = await self._skills_for_user(sub)
        not_own = self._job_not_owned_by_user(sub)
        req_match = self._requirements_match_skills_clause(skills)

        async def _fetch(extra_req: Any | None) -> list[Job]:
            parts: list[Any] = [Job.is_active.is_(True), not_own]
            if extra_req is not None:
                parts.append(extra_req)
            stmt = (
                select(Job)
                .options(selectinload(Job.company), selectinload(Job.tags))
                .where(*parts)
                .order_by(Job.created_at.desc())
                .limit(limit)
            )
            result = await self.session.execute(stmt)
            return list(result.scalars().unique().all())

        if req_match is not None:
            jobs = await _fetch(req_match)
            if jobs:
                return [self._job_summary(j) for j in jobs]

        jobs = await _fetch(None)
        return [self._job_summary(j) for j in jobs]
