from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(..., max_length=200)
    cnpj: str = Field(..., max_length=18)
    website: str = ""
    description: str = ""
    logo_s3_key: str | None = None


class CompanyPatch(BaseModel):
    name: str | None = Field(None, max_length=200)
    cnpj: str | None = Field(None, max_length=18)
    website: str | None = None
    description: str | None = None
    logo_s3_key: str | None = None
