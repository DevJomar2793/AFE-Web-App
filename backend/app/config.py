import os
from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent


def get_environment_file(app_env: str | None = None) -> Path:
    environment = app_env if app_env is not None else os.getenv("APP_ENV", "local")
    environment = environment.strip().lower()

    environment_files = {
        "local": BACKEND_DIRECTORY / ".env.local",
        "prod": BACKEND_DIRECTORY / ".env.prod",
    }

    if environment not in environment_files:
        raise ValueError(
            "APP_ENV must be either 'local' or 'prod'. "
            f"Received: {environment or '(empty)'}."
        )

    return environment_files[environment]


class Settings(BaseSettings):
    app_env: str = "local"
    database_host: str
    database_port: int = 5432
    database_name: str
    database_user: str
    database_password: SecretStr
    database_ssl: bool = False
    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_hours: int = 8
    cors_allowed_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8081,http://127.0.0.1:8081,"
        "https://adamosfresheggs.vercel.app"
    )

    model_config = SettingsConfigDict(
        env_file=get_environment_file(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="postgresql+asyncpg",
            username=self.database_user,
            password=self.database_password.get_secret_value(),
            host=self.database_host,
            port=self.database_port,
            database=self.database_name,
        )

    @property
    def database_connect_args(self) -> dict[str, str]:
        if self.database_ssl:
            return {"ssl": "require"}
        return {}

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
