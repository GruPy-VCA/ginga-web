"""Ginga FastAPI application entrypoint."""

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import FRONTEND_URL
from app.logging_config import request_id_var
from app.routes import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database.connection import close_db

    yield
    await close_db()


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = (
            request.headers.get("x-amzn-trace-id")
            or request.headers.get("x-request-id")
            or str(uuid.uuid4())[:8]
        )
        token = request_id_var.set(req_id)
        try:
            return await call_next(request)
        finally:
            request_id_var.reset(token)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Ginga API",
        description="API REST do Ginga (vagas, empresas, perfis). Autenticação via AWS Cognito.",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(RequestIdMiddleware)
    allowed_origins = ["*"] if FRONTEND_URL == "*" else [FRONTEND_URL]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        max_age=3600,
    )

    @app.get("/health", tags=["Health"])
    async def health_check():
        from datetime import datetime

        from app.database.connection import AsyncSessionLocal

        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {
                "status": "healthy",
                "service": "ginga-api",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "database": "connected",
            }
        except Exception as e:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=503,
                detail={
                    "status": "unhealthy",
                    "service": "ginga-api",
                    "timestamp": datetime.now().isoformat(),
                    "error": str(e),
                },
            ) from e

    app.include_router(api_router, prefix="/api/v1")
    return app


app = create_app()
