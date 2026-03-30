"""AWS Cognito JWT validation (JWKS) and optional local dev bypass."""

import logging
import os
import re
import time
from typing import Any

import requests as http_requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.config import (
    COGNITO_APP_CLIENT_ID,
    COGNITO_ISSUER,
    COGNITO_JWKS_URL,
    COGNITO_USER_POOL_ID,
    DEV_AUTH_BYPASS,
    DEV_AUTH_BYPASS_SECRET,
    IS_DEVELOPMENT,
)

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# Claim `sub` em formato UUID: comparado como string no Postgres (case-sensitive).
_SUB_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
)


def normalize_cognito_sub(sub: str) -> str:
    """Unifica UUID do Cognito em minúsculas para bater com api_users.id / api_profiles.user_id."""
    s = (sub or "").strip()
    if _SUB_UUID_RE.match(s):
        return s.lower()
    return s

_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: float = 0
JWKS_CACHE_TTL = 3600


def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < JWKS_CACHE_TTL:
        return _jwks_cache

    response = http_requests.get(COGNITO_JWKS_URL, timeout=10)
    response.raise_for_status()
    _jwks_cache = response.json()
    _jwks_cache_time = now
    return _jwks_cache


def _get_signing_key(jwks: dict[str, Any], kid: str) -> Any | None:
    for key_data in jwks.get("keys", []):
        if key_data["kid"] == kid:
            return jwk.construct(key_data)
    return None


def decode_cognito_jwt(token: str) -> dict[str, Any]:
    try:
        headers = jwt.get_unverified_headers(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    kid = headers.get("kid")
    if not kid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem kid.",
        )

    jwks = _fetch_jwks()
    signing_key = _get_signing_key(jwks, kid)

    if not signing_key:
        global _jwks_cache_time
        _jwks_cache_time = 0
        jwks = _fetch_jwks()
        signing_key = _get_signing_key(jwks, kid)

    if not signing_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Chave de assinatura não encontrada.",
        )

    try:
        return jwt.decode(
            token,
            signing_key.to_pem().decode("utf-8"),
            algorithms=["RS256"],
            audience=COGNITO_APP_CLIENT_ID,
            issuer=COGNITO_ISSUER,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado.",
        )
    except JWTError as e:
        logger.error("JWT decode error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )


def _dev_bypass_user(token: str) -> dict[str, str] | None:
    if not (IS_DEVELOPMENT and DEV_AUTH_BYPASS and DEV_AUTH_BYPASS_SECRET):
        return None
    if token != DEV_AUTH_BYPASS_SECRET:
        return None
    sub = os.environ.get("DEV_USER_SUB", "dev-local-user")
    email = os.environ.get("DEV_USER_EMAIL", "dev@example.com")
    return {"id": sub, "email": email}


def resolve_user_from_token(token: str) -> dict[str, str]:
    dev = _dev_bypass_user(token)
    if dev:
        return dev

    if not COGNITO_USER_POOL_ID or not COGNITO_APP_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticação Cognito não configurada.",
        )

    payload = decode_cognito_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificação do usuário.",
        )
    return {
        "id": normalize_cognito_sub(str(user_id)),
        "email": payload.get("email", ""),
        "given_name": payload.get("given_name", ""),
        "family_name": payload.get("family_name", ""),
        "username": payload.get("cognito:username", ""),
    }


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, str]:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado.",
        )
    return resolve_user_from_token(credentials.credentials)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, str] | None:
    if credentials is None or not credentials.credentials:
        return None
    try:
        return resolve_user_from_token(credentials.credentials)
    except HTTPException:
        return None
