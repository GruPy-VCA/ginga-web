"""Job applications."""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models import Application, Company, Job, User


class ApplicationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def apply(self, user_id: str, job_id: int, cover_letter: str) -> dict[str, Any]:
        job = await self.session.get(Job, job_id)
        if not job or not job.is_active:
            return {"ok": False, "error": "job_not_found_or_inactive"}
        owner = await self.session.scalar(
            select(Company.owner_id).where(Company.id == job.company_id)
        )
        if owner == user_id:
            return {"ok": False, "error": "cannot_apply_own_company"}
        existing = await self.session.scalar(
            select(Application.id).where(
                Application.user_id == user_id,
                Application.job_id == job_id,
            )
        )
        if existing:
            return {"ok": False, "error": "already_applied"}
        app = Application(
            user_id=user_id,
            job_id=job_id,
            cover_letter=cover_letter or "",
            status="applied",
        )
        self.session.add(app)
        try:
            await self.session.flush()
        except Exception:
            return {"ok": False, "error": "duplicate"}
        return {"ok": True, "id": app.id}

    async def list_mine(
        self,
        user_id: str,
        status_filter: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict[str, Any]], int]:
        id_stmt = select(Application.id).where(Application.user_id == user_id)
        if status_filter:
            id_stmt = id_stmt.where(Application.status == status_filter)
        subq = id_stmt.subquery()
        total = await self.session.scalar(select(func.count()).select_from(subq))

        stmt = (
            select(Application)
            .options(
                selectinload(Application.job).selectinload(Job.company),
            )
            .where(Application.id.in_(select(subq.c.id)))
        )
        stmt = stmt.order_by(Application.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.session.execute(stmt)
        rows = result.scalars().unique().all()
        out = []
        for a in rows:
            j = a.job
            out.append(
                {
                    "id": a.id,
                    "status": a.status,
                    "cover_letter": a.cover_letter,
                    "applied_at": a.created_at.isoformat() if a.created_at else None,
                    "job": {
                        "id": j.id,
                        "title": j.title,
                        "is_active": j.is_active,
                        "company": {
                            "id": j.company.id,
                            "name": j.company.name,
                            "logo_s3_key": j.company.logo_s3_key,
                        },
                    },
                }
            )
        return out, int(total or 0)

    async def withdraw(self, user_id: str, application_id: int) -> bool:
        result = await self.session.execute(
            select(Application).where(
                Application.id == application_id,
                Application.user_id == user_id,
                Application.status == "applied",
            )
        )
        app = result.scalar_one_or_none()
        if not app:
            return False
        await self.session.delete(app)
        await self.session.flush()
        return True

    async def counts_by_status(self, user_id: str) -> dict[str, int]:
        stmt = (
            select(Application.status, func.count())
            .where(Application.user_id == user_id)
            .group_by(Application.status)
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        base = {"applied": 0, "interviewing": 0, "approved": 0, "rejected": 0}
        for status, cnt in rows:
            if status in base:
                base[status] = int(cnt)
        return base

    def _recruiter_application_filters(
        self,
        owner_id: str,
        job_id: int | None,
        company_id: int | None,
        status_filter: str | None,
    ):
        stmt = (
            select(Application.id)
            .join(Job, Application.job_id == Job.id)
            .join(Company, Job.company_id == Company.id)
            .where(Company.owner_id == owner_id)
        )
        if job_id is not None:
            stmt = stmt.where(Application.job_id == job_id)
        if company_id is not None:
            stmt = stmt.where(Job.company_id == company_id)
        if status_filter:
            stmt = stmt.where(Application.status == status_filter)
        return stmt

    async def list_for_recruiter(
        self,
        owner_id: str,
        job_id: int | None,
        company_id: int | None,
        status_filter: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[dict[str, Any]], int]:
        id_stmt = self._recruiter_application_filters(owner_id, job_id, company_id, status_filter)
        subq = id_stmt.subquery()
        total = await self.session.scalar(select(func.count()).select_from(subq))

        stmt = (
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .join(Company, Job.company_id == Company.id)
            .where(Company.owner_id == owner_id)
            .options(
                selectinload(Application.job).selectinload(Job.company),
                selectinload(Application.user),
            )
        )
        if job_id is not None:
            stmt = stmt.where(Application.job_id == job_id)
        if company_id is not None:
            stmt = stmt.where(Job.company_id == company_id)
        if status_filter:
            stmt = stmt.where(Application.status == status_filter)
        stmt = (
            stmt.order_by(Application.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        rows = result.scalars().unique().all()
        out: list[dict[str, Any]] = []
        for a in rows:
            j = a.job
            u = a.user
            name_parts = [u.first_name or "", u.last_name or ""]
            display = " ".join(p for p in name_parts if p).strip() or (u.email or "Candidato")
            out.append(
                {
                    "id": a.id,
                    "status": a.status,
                    "applied_at": a.created_at.isoformat() if a.created_at else None,
                    "cover_letter": a.cover_letter,
                    "feedback_text": a.feedback_text,
                    "candidate": {
                        "id": u.id,
                        "email": u.email,
                        "display_name": display,
                    },
                    "job": {
                        "id": j.id,
                        "title": j.title,
                        "is_active": j.is_active,
                        "company": {
                            "id": j.company.id,
                            "name": j.company.name,
                            "logo_s3_key": j.company.logo_s3_key,
                        },
                    },
                }
            )
        return out, int(total or 0)

    async def recruiter_update_status(
        self,
        owner_id: str,
        application_id: int,
        new_status: str,
        feedback_text: str,
    ) -> dict[str, Any] | None:
        allowed = {"applied", "interviewing", "approved", "rejected"}
        if new_status not in allowed:
            return None
        result = await self.session.execute(
            select(Application)
            .join(Job, Application.job_id == Job.id)
            .join(Company, Job.company_id == Company.id)
            .where(
                Application.id == application_id,
                Company.owner_id == owner_id,
            )
            .options(selectinload(Application.job).selectinload(Job.company), selectinload(Application.user))
        )
        app = result.scalar_one_or_none()
        if not app:
            return None
        app.status = new_status
        if feedback_text is not None:
            app.feedback_text = (feedback_text or "").strip()
        await self.session.flush()
        u = app.user
        j = app.job
        name_parts = [u.first_name or "", u.last_name or ""]
        display = " ".join(p for p in name_parts if p).strip() or (u.email or "Candidato")
        return {
            "id": app.id,
            "status": app.status,
            "applied_at": app.created_at.isoformat() if app.created_at else None,
            "cover_letter": app.cover_letter,
            "feedback_text": app.feedback_text,
            "candidate": {
                "id": u.id,
                "email": u.email,
                "display_name": display,
            },
            "job": {
                "id": j.id,
                "title": j.title,
                "is_active": j.is_active,
                "company": {
                    "id": j.company.id,
                    "name": j.company.name,
                    "logo_s3_key": j.company.logo_s3_key,
                },
            },
        }
