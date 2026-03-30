#!/usr/bin/env python3
"""Idempotent tag seed (run from repo root: uv run python scripts/load_techs.py)."""

import asyncio
import sys
from pathlib import Path

# Allow running without installing as package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.connection import AsyncSessionLocal, engine
from app.database.models import Tag
from app.tech_list import TECH_LIST
from sqlalchemy import select


async def run() -> None:
    async with AsyncSessionLocal() as session:
        created = 0
        existing = 0
        for name in TECH_LIST:
            result = await session.execute(select(Tag).where(Tag.name == name))
            if result.scalar_one_or_none():
                existing += 1
                continue
            session.add(Tag(name=name))
            created += 1
        await session.commit()
    print(f"Sucesso: {len(TECH_LIST)} tecnologias processadas.")
    if created:
        print(f"  {created} novas tags criadas")
    if existing:
        print(f"  {existing} tags já existiam")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
