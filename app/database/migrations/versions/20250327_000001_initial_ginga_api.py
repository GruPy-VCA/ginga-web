"""initial ginga api schema

Revision ID: 000001
Revises:
Create Date: 2025-03-27

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "000001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "api_users",
        sa.Column("id", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("first_name", sa.String(length=150), nullable=False),
        sa.Column("last_name", sa.String(length=150), nullable=False),
        sa.Column("username", sa.String(length=150), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("legacy_user_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("legacy_user_id"),
    )
    op.create_index("ix_api_users_email", "api_users", ["email"], unique=False)

    op.create_table(
        "api_tags",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_api_tags_name"),
    )
    op.create_index("ix_api_tags_name", "api_tags", ["name"], unique=False)

    op.create_table(
        "api_profiles",
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("avatar_s3_key", sa.String(length=512), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("contact_info", sa.Text(), nullable=False),
        sa.Column("skills", sa.Text(), nullable=False),
        sa.Column("github_url", sa.String(length=500), nullable=False),
        sa.Column("linkedin_url", sa.String(length=500), nullable=False),
        sa.Column("is_portfolio_public", sa.Boolean(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["api_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index("ix_api_profiles_slug", "api_profiles", ["slug"], unique=True)

    op.create_table(
        "api_companies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("cnpj", sa.String(length=18), nullable=False),
        sa.Column("logo_s3_key", sa.String(length=512), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["api_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cnpj"),
    )
    op.create_index("ix_api_companies_owner_id", "api_companies", ["owner_id"])

    op.create_table(
        "api_jobs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("requirements", sa.Text(), nullable=False),
        sa.Column("salary_range", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["api_companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_jobs_company_id", "api_jobs", ["company_id"])

    op.create_table(
        "api_job_tags",
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["api_jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["api_tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("job_id", "tag_id"),
        sa.UniqueConstraint("job_id", "tag_id", name="uq_api_job_tags"),
    )

    op.create_table(
        "api_applications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("rejection_reason", sa.String(length=30), nullable=False),
        sa.Column("feedback_text", sa.Text(), nullable=False),
        sa.Column("cover_letter", sa.Text(), nullable=False),
        sa.Column("resume_s3_key", sa.String(length=512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["job_id"], ["api_jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["api_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "job_id", name="uq_api_applications_user_job"),
    )
    op.create_index("ix_api_applications_user_id", "api_applications", ["user_id"])
    op.create_index("ix_api_applications_job_id", "api_applications", ["job_id"])

    op.create_table(
        "api_professional_experiences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("profile_user_id", sa.String(length=255), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=False),
        sa.Column("role", sa.String(length=200), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["profile_user_id"],
            ["api_profiles.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_api_professional_experiences_profile_user_id",
        "api_professional_experiences",
        ["profile_user_id"],
    )

    op.create_table(
        "api_education",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("profile_user_id", sa.String(length=255), nullable=False),
        sa.Column("institution", sa.String(length=200), nullable=False),
        sa.Column("course", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["profile_user_id"],
            ["api_profiles.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_education_profile_user_id", "api_education", ["profile_user_id"])

    op.create_table(
        "api_tech_projects",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("profile_user_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("project_type", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["profile_user_id"],
            ["api_profiles.user_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_api_tech_projects_profile_user_id",
        "api_tech_projects",
        ["profile_user_id"],
    )

    op.create_unique_constraint("uq_api_users_username", "api_users", ["username"])


def downgrade() -> None:
    op.drop_table("api_tech_projects")
    op.drop_table("api_education")
    op.drop_table("api_professional_experiences")
    op.drop_table("api_applications")
    op.drop_table("api_job_tags")
    op.drop_table("api_jobs")
    op.drop_table("api_companies")
    op.drop_table("api_profiles")
    op.drop_table("api_tags")
    op.drop_constraint("uq_api_users_username", "api_users", type_="unique")
    op.drop_table("api_users")
