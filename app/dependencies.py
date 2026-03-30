"""FastAPI dependencies."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db

__all__ = ["get_db"]


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db():
        yield session
