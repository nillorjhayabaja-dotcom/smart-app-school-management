"""
Core application settings and configuration using Pydantic v2.

This module provides environment-based configuration with validation,
secure defaults, and support for different deployment environments.
"""

from typing import List
from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    
    Uses Pydantic v2 BaseSettings for:
    - Environment variable loading and validation
    - Type coercion and validation
    - Clear documentation of all config options
    - Production-safe defaults
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore unexpected environment variables
        case_sensitive=False,
    )

    # =========================================================================
    # APPLICATION SETTINGS
    # =========================================================================
    app_name: str = Field(
        default="School Management System Backend",
        description="Application display name",
    )
    api_prefix: str = Field(
        default="/api/v1",
        description="Base path prefix for all API endpoints",
    )
    environment: str = Field(
        default="local",
        description="Deployment environment: local, staging, or production",
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode (should be False in production)",
    )

    # =========================================================================
    # DATABASE CONFIGURATION
    # =========================================================================
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/school_management",
        description="PostgreSQL connection URL with asyncpg driver",
    )

    @validator("database_url")
    def validate_database_url(cls, v: str) -> str:
        """Ensure database URL uses async driver."""
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must use postgresql+asyncpg:// driver for async connections"
            )
        return v

    # =========================================================================
    # JWT AUTHENTICATION SETTINGS
    # =========================================================================
    jwt_secret_key: str = Field(
        default="your-super-secret-key-change-in-production-min-32-chars",
        min_length=32,
        description="Secret key for JWT signing (min 32 characters, change in production)",
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm (HS256, RS256, etc.)",
    )
    access_token_expire_minutes: int = Field(
        default=30,
        ge=1,
        le=1440,
        description="Access token expiration time in minutes (1-1440)",
    )
    refresh_token_expire_days: int = Field(
        default=7,
        ge=1,
        le=365,
        description="Refresh token expiration time in days (1-365)",
    )

    @validator("jwt_algorithm")
    def validate_jwt_algorithm(cls, v: str) -> str:
        """Validate JWT algorithm is supported."""
        supported = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"]
        if v not in supported:
            raise ValueError(f"JWT_ALGORITHM must be one of {supported}")
        return v

    # =========================================================================
    # CORS CONFIGURATION
    # =========================================================================
    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        description="Comma-separated list of allowed CORS origins",
    )

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # =========================================================================
    # REDIS CONFIGURATION
    # =========================================================================
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL for caching",
    )

    # =========================================================================
    # CELERY CONFIGURATION (Task Queue)
    # =========================================================================
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        description="Celery message broker URL",
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2",
        description="Celery result backend URL",
    )

    # =========================================================================
    # SECURITY SETTINGS
    # =========================================================================
    enable_secure_headers: bool = Field(
        default=True,
        description="Enable security headers (HSTS, CSP, etc.)",
    )

    # =========================================================================
    # LOGGING SETTINGS
    # =========================================================================
    log_level: int = Field(
        default=20,  # logging.INFO
        ge=0,
        le=50,
        description="Logging level (0-50, see Python logging module)",
    )

    # =========================================================================
    # COMPUTED PROPERTIES
    # =========================================================================
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development/local environment."""
        return self.environment.lower() in ("local", "development")

    def get_jwt_config(self) -> dict:
        """
        Get JWT configuration as a dictionary.
        
        Returns:
            dict with jwt_secret_key, jwt_algorithm, and token expiration settings
        """
        return {
            "secret_key": self.jwt_secret_key,
            "algorithm": self.jwt_algorithm,
            "access_token_expire_minutes": self.access_token_expire_minutes,
            "refresh_token_expire_days": self.refresh_token_expire_days,
        }


# Create global settings instance
settings = Settings()


