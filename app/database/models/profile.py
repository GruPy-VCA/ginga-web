"""Portfolio profile (1:1 with User)."""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    __tablename__ = "api_profiles"

    user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("api_users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio: Mapped[str] = mapped_column(Text, default="", nullable=False)
    avatar_s3_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    city: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    contact_info: Mapped[str] = mapped_column(Text, default="", nullable=False)
    skills: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False,
        comment="Comma-separated skills",
    )
    github_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    linkedin_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    is_portfolio_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    user = relationship("User", back_populates="profile")
    experiences = relationship(
        "ProfessionalExperience",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
    education_rows = relationship(
        "Education",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
    tech_projects = relationship(
        "TechProject",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
