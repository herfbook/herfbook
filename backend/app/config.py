import os
import yaml
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Type

from pydantic.fields import FieldInfo
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource


class YamlConfigSource(PydanticBaseSettingsSource):
    """Loads settings from a YAML file.

    Checks HERFBOOK_CONFIG_FILE env var first, then falls back to config.yml
    in the working directory. Lower priority than env vars and .env file.
    """

    def _load(self) -> Dict[str, Any]:
        config_path = os.getenv("HERFBOOK_CONFIG_FILE")
        if not config_path and Path("config.yml").exists():
            config_path = "config.yml"
        if config_path and Path(config_path).exists():
            with open(config_path) as f:
                return yaml.safe_load(f) or {}
        return {}

    def get_field_value(
        self, field: FieldInfo, field_name: str
    ) -> Tuple[Any, str, bool]:
        return self._load().get(field_name), field_name, False

    def __call__(self) -> Dict[str, Any]:
        return self._load()


class Settings(BaseSettings):
    # Database
    postgres_user: str = "herfbook"
    postgres_password: str = "changeme"
    postgres_db: str = "herfbook"
    postgres_host: str = "herfbook-db"
    postgres_port: int = 5432

    # MinIO
    minio_endpoint: str = "herfbook-minio:9000"
    minio_root_user: str = "herfbook"
    minio_root_password: str = "changeme"

    # Auth
    jwt_secret: str = "changeme-replace-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    allow_registration: bool = False

    # Community sync
    community_sync_on_startup: bool = True
    github_community_repo: str = "herfbook/herfbook"

    herfbook_config_file: Optional[str] = None

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: Type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
        **kwargs: Any,
    ) -> Tuple[PydanticBaseSettingsSource, ...]:
        # Priority: init kwargs > env vars > .env file > config.yml > file secrets
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            YamlConfigSource(settings_cls),
            file_secret_settings,
        )


settings = Settings()
