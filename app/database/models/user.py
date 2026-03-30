"""User row synced with Cognito (sub = id)."""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "api_users"

    id: Mapped[str] = mapped_column(String(255), primary_key=True)  # Cognito sub
    email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    last_name: Mapped[str] = mapped_column(String(150), default="", nullable=False)
    username: Mapped[str | None] = mapped_column(String(150), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Optional bridge for ETL from Django
    legacy_user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, unique=True, index=True
    )

    profile = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    companies = relationship("Company", back_populates="owner")
    applications = relationship("Application", back_populates="user")
