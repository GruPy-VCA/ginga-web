"""Async PostgreSQL engine and session (Lambda-friendly NullPool)."""

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import (
    DATABASE_URL,
    DB_POOL_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
)

IS_TESTING = os.getenv("ENVIRONMENT", "development").lower() == "testing"
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_LAMBDA = os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

USE_NULL_POOL = IS_SQLITE or IS_TESTING or IS_LAMBDA

if IS_SQLITE:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        poolclass=NullPool,
    )
else:
    engine_kwargs: dict = {"echo": False, "future": True}
    if USE_NULL_POOL:
        engine_kwargs["poolclass"] = NullPool
    else:
        engine_kwargs.update(
            {
                "pool_size": DB_POOL_SIZE,
                "max_overflow": DB_POOL_MAX_OVERFLOW,
                "pool_timeout": DB_POOL_TIMEOUT,
                "pool_recycle": DB_POOL_RECYCLE,
            }
        )
    engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create tables (dev only; prefer Alembic in production)."""
    import app.database.models  # noqa: F401
    from app.database.base import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    await engine.dispose()
