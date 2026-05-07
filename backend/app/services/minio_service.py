from __future__ import annotations

import io
import uuid as _uuid
from uuid import UUID

import boto3
from botocore.exceptions import ClientError

from app.config import settings

BUCKET_NAME = "herfbook-images"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _detect_content_type(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


class MinIOService:
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=f"http://{settings.minio_endpoint}",
            aws_access_key_id=settings.minio_root_user,
            aws_secret_access_key=settings.minio_root_password,
        )
        self._bucket_ensured = False

    def _ensure_bucket(self) -> None:
        if self._bucket_ensured:
            return
        try:
            self._client.head_bucket(Bucket=BUCKET_NAME)
        except ClientError:
            self._client.create_bucket(Bucket=BUCKET_NAME)
        self._bucket_ensured = True

    def upload_image(
        self,
        data: bytes,
        content_type: str,
        user_id: UUID,
        cigar_id: UUID,
        original_filename: str,
    ) -> str:
        """Validate and upload image bytes to MinIO. Returns the S3 key."""
        if len(data) > MAX_FILE_SIZE:
            raise ValueError("File exceeds 5 MB limit")
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError(f"Content type {content_type!r} not allowed")
        detected = _detect_content_type(data)
        if detected != content_type:
            raise ValueError("File content does not match declared content type")

        self._ensure_bucket()
        key = f"{user_id}/{cigar_id}/{_uuid.uuid4()}_{original_filename}"
        self._client.put_object(
            Bucket=BUCKET_NAME,
            Key=key,
            Body=io.BytesIO(data),
            ContentType=content_type,
            ContentLength=len(data),
        )
        return key

    def delete_image(self, s3_key: str) -> None:
        """Delete an image from MinIO by its S3 key."""
        self._ensure_bucket()
        self._client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)

    def get_presigned_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate a presigned GET URL. This is a local signing operation — no network call."""
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expires_in,
        )


_minio_service: MinIOService | None = None


def get_minio_service() -> MinIOService:
    global _minio_service
    if _minio_service is None:
        _minio_service = MinIOService()
    return _minio_service
