from pydantic import BaseModel, field_validator


class ProfilePatch(BaseModel):
    """PATCH parcial; `null` em campos NOT NULL vira '' ou false."""

    bio: str | None = None
    city: str | None = None
    contact_info: str | None = None
    skills: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    is_portfolio_public: bool | None = None
    is_published: bool | None = None
    avatar_s3_key: str | None = None

    @field_validator(
        "bio",
        "city",
        "contact_info",
        "skills",
        "github_url",
        "linkedin_url",
        mode="before",
    )
    @classmethod
    def _null_string_to_empty(cls, v: object) -> object:
        return "" if v is None else v

    @field_validator("is_portfolio_public", "is_published", mode="before")
    @classmethod
    def _null_bool_to_false(cls, v: object) -> object:
        return False if v is None else v


class MePatch(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None  # slug público; espelhado em api_users.username
    profile: ProfilePatch | None = None


class ExperienceCreate(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: str | None = None
    description: str = ""


class ExperiencePatch(BaseModel):
    company: str | None = None
    role: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class EducationCreate(BaseModel):
    institution: str
    course: str
    status: str = "in_progress"
    start_date: str | None = None
    end_date: str | None = None


class EducationPatch(BaseModel):
    institution: str | None = None
    course: str | None = None
    status: str | None = None
    start_date: str | None = None
    end_date: str | None = None


class TechProjectCreate(BaseModel):
    name: str
    description: str = ""
    url: str = ""
    project_type: str = "open_source"


class TechProjectPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    url: str | None = None
    project_type: str | None = None
