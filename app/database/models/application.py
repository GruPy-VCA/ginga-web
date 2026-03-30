"""Job application."""

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Application(Base, TimestampMixin):
    __tablename__ = "api_applications"
    __table_args__ = (UniqueConstraint("user_id", "job_id", name="uq_api_applications_user_job"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("api_users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        ForeignKey("api_jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="applied", nullable=False)
    rejection_reason: Mapped[str] = mapped_column(String(30), default="", nullable=False)
    feedback_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    cover_letter: Mapped[str] = mapped_column(Text, default="", nullable=False)
    resume_s3_key: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
