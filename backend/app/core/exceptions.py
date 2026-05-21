"""
Custom exceptions and error handlers for the application.

Provides:
- Custom exception classes for common error scenarios
- FastAPI exception handlers for clean HTTP error responses
- Structured error logging
"""

import logging
import traceback
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger(__name__)


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================


class AppException(Exception):
    """Base exception for all application exceptions."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Optional[str] = None,
        error_code: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail or message
        self.error_code = error_code or "INTERNAL_ERROR"
        super().__init__(self.message)


class NotFoundException(AppException):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
    ):
        if resource_type and resource_id:
            message = f"{resource_type} with id {resource_id} not found"
        
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
        )


class BadRequestException(AppException):
    """Raised when a request is malformed or invalid."""
    
    def __init__(
        self,
        message: str = "Bad request",
        detail: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BAD_REQUEST",
        )


class UnauthorizedException(AppException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        message: str = "Unauthorized",
        detail: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    """Raised when access is denied."""
    
    def __init__(
        self,
        message: str = "Access denied",
        detail: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class ConflictException(AppException):
    """Raised when a resource conflict occurs (e.g., duplicate)."""
    
    def __init__(
        self,
        message: str = "Resource conflict",
        detail: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class ValidationException(AppException):
    """Raised when data validation fails."""
    
    def __init__(
        self,
        message: str = "Validation failed",
        errors: Optional[list] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=errors,
            error_code="VALIDATION_ERROR",
        )


class DatabaseException(AppException):
    """Raised when a database operation fails."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        detail: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="DATABASE_ERROR",
        )


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers with the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        """Handle custom application exceptions."""
        logger.warning(
            f"Application exception: {exc.error_code} - {exc.message}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
            },
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.message,
                "error_code": exc.error_code,
                "detail": exc.detail if exc.detail != exc.message else None,
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Handle FastAPI request validation errors."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        
        logger.warning(
            f"Validation error: {errors}",
            extra={
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "message": "Request validation failed",
                "error_code": "VALIDATION_ERROR",
                "details": errors,
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        request: Request,
        exc: IntegrityError,
    ) -> JSONResponse:
        """Handle database integrity errors (unique constraints, etc.)."""
        error_detail = str(exc.orig) if hasattr(exc, "orig") else str(exc)
        
        logger.error(
            f"Database integrity error: {error_detail}",
            extra={
                "path": request.url.path,
                "method": request.method,
            },
            exc_info=True,
        )
        
        # Check for unique constraint violation
        if "unique" in error_detail.lower() or "duplicate" in error_detail.lower():
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "error": True,
                    "message": "Resource already exists",
                    "error_code": "CONFLICT",
                    "detail": "A resource with the same unique fields already exists",
                    "path": request.url.path,
                },
            )
        
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": True,
                "message": "Database constraint violation",
                "error_code": "DATABASE_ERROR",
                "detail": error_detail,
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(
        request: Request,
        exc: SQLAlchemyError,
    ) -> JSONResponse:
        """Handle general SQLAlchemy errors."""
        logger.error(
            f"Database error: {str(exc)}",
            extra={
                "path": request.url.path,
                "method": request.method,
            },
            exc_info=True,
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": "Database operation failed",
                "error_code": "DATABASE_ERROR",
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(ValidationError)
    async def pydantic_validation_error_handler(
        request: Request,
        exc: ValidationError,
    ) -> JSONResponse:
        """Handle Pydantic validation errors."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
            })
        
        logger.warning(
            f"Pydantic validation error: {errors}",
            extra={
                "path": request.url.path,
                "method": request.method,
            },
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "message": "Data validation failed",
                "error_code": "VALIDATION_ERROR",
                "details": errors,
                "path": request.url.path,
            },
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """Handle all unhandled exceptions."""
        logger.error(
            f"Unhandled exception: {str(exc)}",
            extra={
                "path": request.url.path,
                "method": request.method,
            },
            exc_info=True,
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": "An unexpected error occurred",
                "error_code": "INTERNAL_ERROR",
                "path": request.url.path,
            },
        )