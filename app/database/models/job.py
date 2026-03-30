"""Job posting."""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Job(Base, TimestampMixin):
    __tablename__ = "api_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("api_companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, default="", nullable=False)
    salary_range: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="jobs")
    tags = relationship("Tag", secondary="api_job_tags", back_populates="jobs")
    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
    )
