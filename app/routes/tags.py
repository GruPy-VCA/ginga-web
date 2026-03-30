"""Tag autocomplete."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.database.models import Tag

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("")
async def list_tags(
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Tag).order_by(Tag.name).limit(limit)
    if q:
        stmt = select(Tag).where(Tag.name.ilike(f"%{q}%")).order_by(Tag.name).limit(limit)
    result = await session.execute(stmt)
    rows = result.scalars().all()
    return [{"name": t.name} for t in rows]
