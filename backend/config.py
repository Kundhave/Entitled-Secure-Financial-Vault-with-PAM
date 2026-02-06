import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str
    ENCRYPTION_KEY: str
    DATABASE_URL: str
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    PRIVILEGE_SESSION_DURATION_MINUTES: int = 3
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
