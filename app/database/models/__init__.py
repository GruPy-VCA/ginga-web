"""Import all models for Alembic metadata."""

from app.database.models.application import Application
from app.database.models.company import Company
from app.database.models.job import Job
from app.database.models.portfolio import Education, ProfessionalExperience, TechProject
from app.database.models.profile import Profile
from app.database.models.tag import JobTag, Tag
from app.database.models.user import User

__all__ = [
    "Application",
    "Company",
    "Education",
    "Job",
    "JobTag",
    "ProfessionalExperience",
    "Profile",
    "Tag",
    "TechProject",
    "User",
]
