"""Professional experience, education, tech projects."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class ProfessionalExperience(Base, TimestampMixin):
    __tablename__ = "api_professional_experiences"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("api_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

    profile = relationship("Profile", back_populates="experiences")


class Education(Base, TimestampMixin):
    __tablename__ = "api_education"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("api_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution: Mapped[str] = mapped_column(String(200), nullable=False)
    course: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="in_progress", nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    profile = relationship("Profile", back_populates="education_rows")


class TechProject(Base, TimestampMixin):
    __tablename__ = "api_tech_projects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("api_profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    project_type: Mapped[str] = mapped_column(String(20), default="open_source", nullable=False)

    profile = relationship("Profile", back_populates="tech_projects")
