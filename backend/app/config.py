from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    database_host: str
    database_port: int = 5432
    database_name: str
    database_user: str
    database_password: SecretStr
    database_ssl: bool = False
    jwt_secret_key: SecretStr
    jwt_access_token_expire_minutes: int = 480
    initial_admin_email: str | None = None
    initial_admin_password: SecretStr | None = None
    cors_allowed_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8081,http://127.0.0.1:8081,"
        "https://adamosfresheggs.vercel.app"
    )

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIRECTORY / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_initial_admin(self) -> "Settings":
        has_email = bool(self.initial_admin_email)
        has_password = self.initial_admin_password is not None
        if has_email != has_password:
            raise ValueError(
                "INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set together"
            )
        return self

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
