from typing import Literal

from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    requirements: str = ""
    salary_range: str = ""
    is_active: bool = True
    tags: list[str] = []


class JobPatch(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = None
    requirements: str | None = None
    salary_range: str | None = None
    is_active: bool | None = None
    tags: list[str] | None = None


class ApplyBody(BaseModel):
    cover_letter: str = ""


class RecruiterApplicationPatch(BaseModel):
    status: Literal["applied", "interviewing", "approved", "rejected"]
    feedback_text: str = ""
