"""Environment configuration for Ginga API."""

import logging
import os

from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").lower()
VALID_ENVIRONMENTS = ("development", "testing", "production")
if ENVIRONMENT not in VALID_ENVIRONMENTS:
    raise ValueError(f"ENVIRONMENT must be one of: {VALID_ENVIRONMENTS}")

IS_DEVELOPMENT = ENVIRONMENT == "development"
IS_TESTING = ENVIRONMENT == "testing"
IS_PRODUCTION = ENVIRONMENT == "production"

log_level = logging.INFO if IS_PRODUCTION else logging.WARNING

from app.logging_config import setup_logging  # noqa: E402

setup_logging(level=log_level)

# AWS Cognito
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID", "")
COGNITO_REGION = os.environ.get("COGNITO_REGION", "us-east-1")
COGNITO_ISSUER = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
    if COGNITO_USER_POOL_ID
    else ""
)
COGNITO_JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json" if COGNITO_ISSUER else ""

# When true and ENVIRONMENT=development, accept Bearer tokens without Cognito verification
# (value must equal DEV_AUTH_BYPASS_SECRET). Never enable in production.
DEV_AUTH_BYPASS = os.environ.get("DEV_AUTH_BYPASS", "false").lower() == "true"
DEV_AUTH_BYPASS_SECRET = os.environ.get("DEV_AUTH_BYPASS_SECRET", "")

# CORS
FRONTEND_URL = os.environ.get("FRONTEND_URL", "*")

# Database (async PostgreSQL)
def _normalize_database_url(url: str) -> str:
    """Ensure asyncpg driver; map Heroku-style postgres:// to postgresql+asyncpg."""
    scheme = url.split("://", 1)[0] if "://" in url else ""
    if "+asyncpg" in scheme:
        return url
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalize_database_url(
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://ginga_user:ginga_password@localhost:5432/ginga",
    )
)

DB_POOL_SIZE = int(os.environ.get("DB_POOL_SIZE", "20"))
DB_POOL_MAX_OVERFLOW = int(os.environ.get("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.environ.get("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.environ.get("DB_POOL_RECYCLE", "3600"))

AUTO_RUN_MIGRATIONS = os.environ.get("AUTO_RUN_MIGRATIONS", "false").lower() == "true"

# S3
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")
S3_REGION = os.environ.get("S3_REGION", COGNITO_REGION or "us-east-1")

MAX_FILE_SIZE = int(os.environ.get("MAX_FILE_SIZE", str(10 * 1024 * 1024)))
