"""Service injection."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.services.application_service import ApplicationService
from app.services.company_service import CompanyService
from app.services.job_service import JobService
from app.services.user_service import UserService


def get_user_service(session: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(session)


def get_company_service(session: AsyncSession = Depends(get_db)) -> CompanyService:
    return CompanyService(session)


def get_job_service(session: AsyncSession = Depends(get_db)) -> JobService:
    return JobService(session)


def get_application_service(session: AsyncSession = Depends(get_db)) -> ApplicationService:
    return ApplicationService(session)
