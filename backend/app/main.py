"""
FastAPI application factory and configuration.

Creates and configures the FastAPI application with:
- CORS middleware for frontend integration
- Security headers middleware
- Request tracking middleware
- Exception handlers for clean error responses
- API routes
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.db import close_db, init_db
from app.core.exceptions import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.core.settings import settings
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

logger = get_logger(__name__, json_format=settings.is_production)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles:
    - Startup: Initialize database, setup logging
    - Shutdown: Close database connections
    """
    # Startup
    logger.info("Starting up application...")
    setup_logging(
        level=settings.log_level,
        json_format=settings.is_production,
    )
    
    # Initialize database tables (for development)
    if settings.environment == "local":
        try:
            await init_db()
            logger.info("Database tables initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await close_db()
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Configures:
    - Lifespan management for startup/shutdown
    - CORS middleware with allowed origins from settings
    - Security headers middleware for production environments
    - Request ID tracking for all requests
    - Exception handlers for clean error responses
    - API routes with versioning
    
    Returns:
        FastAPI application instance ready for serving requests
    """
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    # Register exception handlers
    register_exception_handlers(app)

    # Security headers middleware (applies to all responses)
    if settings.enable_secure_headers:
        app.add_middleware(SecurityHeadersMiddleware)

    # Request ID middleware for logging and tracing
    app.add_middleware(RequestIdMiddleware)

    # CORS middleware (applies to all routes)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes with versioned prefix
    app.include_router(api_router, prefix=settings.api_prefix)
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}
    
    return app


# Create the application instance
app = create_app()


