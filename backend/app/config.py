from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration, loaded from environment variables."""

    app_name: str = "Meeting Notes & Transcription Platform API"
    database_url: str = "sqlite:///./meetings.db"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    llm_max_context_chars: int = 20_000  # keeps prompts inside Groq's free-tier token limits
    max_upload_size_bytes: int = 2 * 1024 * 1024  # 2 MB

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
