import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        DATABASE_URL,
        postgresql://postgres:root@localhost:5432/evocrm
    )
    SERVICE_TOKEN: str = os.getenv(SERVICE_TOKEN, )
    PORT: int = int(os.getenv(PORT, 8001))
    HOST: str = os.getenv(HOST, 0.0.0.0)

    class Config:
        env_file = .env
        extra = ignore


settings = Settings()
