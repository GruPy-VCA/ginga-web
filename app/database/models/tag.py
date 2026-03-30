"""Technology tags and job association."""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Tag(Base):
    __tablename__ = "api_tags"
    __table_args__ = (UniqueConstraint("name", name="uq_api_tags_name"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    jobs = relationship("Job", secondary="api_job_tags", back_populates="tags")


class JobTag(Base):
    __tablename__ = "api_job_tags"
    __table_args__ = (UniqueConstraint("job_id", "tag_id", name="uq_api_job_tags"),)

    job_id: Mapped[int] = mapped_column(
        ForeignKey("api_jobs.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id: Mapped[int] = mapped_column(
        ForeignKey("api_tags.id", ondelete="CASCADE"),
        primary_key=True,
    )
