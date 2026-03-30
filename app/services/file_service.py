"""S3 presigned URLs for uploads and downloads."""

import logging
import uuid
from typing import Any

import boto3
from botocore.exceptions import ClientError

from app.config import S3_BUCKET_NAME, S3_REGION

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOC_EXT = {".pdf", ".doc", ".docx"}
PRESIGNED_UPLOAD_EXPIRY = 300
PRESIGNED_DOWNLOAD_EXPIRY = 3600


def _client():
    return boto3.client("s3", region_name=S3_REGION)


class FileService:
    @staticmethod
    def _validate(ext: str, allowed: set[str]) -> tuple[bool, str]:
        e = ext.lower() if ext.startswith(".") else f".{ext.lower()}"
        if e not in allowed:
            return False, f"Extensão não permitida: {e}"
        return True, ""

    @staticmethod
    def presign_upload(
        *,
        purpose: str,
        owner_id: str,
        file_ext: str,
        allow_documents: bool = False,
    ) -> dict[str, Any]:
        if not S3_BUCKET_NAME:
            return {"error": "Armazenamento de arquivos não configurado (defina S3_BUCKET_NAME)."}

        allowed = ALLOWED_IMAGE_EXT | (ALLOWED_DOC_EXT if allow_documents else set())
        ok, msg = FileService._validate(file_ext, allowed)
        if not ok:
            return {"error": msg}

        ext = file_ext.lower() if file_ext.startswith(".") else f".{file_ext.lower()}"
        key = f"ginga/{purpose}/{owner_id}/{uuid.uuid4().hex}{ext}"
        s3 = _client()
        try:
            url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": S3_BUCKET_NAME,
                    "Key": key,
                    "ContentType": "application/octet-stream",
                },
                ExpiresIn=PRESIGNED_UPLOAD_EXPIRY,
            )
            return {"upload_url": url, "s3_key": key, "expires_in": PRESIGNED_UPLOAD_EXPIRY}
        except ClientError as e:
            logger.error("presign upload: %s", e)
            return {"error": "Falha ao gerar URL de upload"}

    @staticmethod
    def presign_download(s3_key: str | None) -> str | None:
        if not s3_key or not S3_BUCKET_NAME:
            return None
        s3 = _client()
        try:
            return s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
                ExpiresIn=PRESIGNED_DOWNLOAD_EXPIRY,
            )
        except ClientError as e:
            logger.error("presign download: %s", e)
            return None

    @staticmethod
    def head_object(s3_key: str) -> bool:
        if not S3_BUCKET_NAME:
            return False
        try:
            _client().head_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            return True
        except ClientError:
            return False
