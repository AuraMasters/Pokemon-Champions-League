from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./esports.db" # Defaulting back to SQLite for easy setup
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    RP_ID: str = "localhost"
    RP_NAME: str = "PCL Esports"
    ORIGIN: str = "http://localhost:5173"
    
    JWT_SECRET: str = "SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    class Config:
        env_file = ".env"

settings = Settings()