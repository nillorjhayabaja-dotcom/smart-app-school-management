"""
JWT Authentication Middleware.

Provides FastAPI dependencies for:
- Extracting and validating JWT tokens from requests
- Loading current user from token
- Optional authentication (allows unauthenticated access)
"""

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session_factory
from app.core.jwt_handler import (
    InvalidTokenException,
    TokenExpiredException,
    verify_token,
)
from app.models.user import User
from app.repositories.user import UserRepository


# HTTP Bearer scheme for OpenAPI documentation
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(lambda: async_session_factory()),
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    This dependency:
    1. Extracts the Bearer token from Authorization header
    2. Validates the token signature and expiration
    3. Loads the user from the database
    4. Raises 401/403 if authentication fails
    
    Args:
        credentials: HTTP Bearer credentials from request
        db: Database session
        
    Returns:
        Authenticated User instance
        
    Raises:
        HTTPException: 401 if not authenticated or token invalid
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Load user from database
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id_with_roles(user_id)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )
        
        # Store user in request state for logging
        return user
        
    except TokenExpiredException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(lambda: async_session_factory()),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    This dependency is useful for endpoints that work differently
    for authenticated vs unauthenticated users.
    
    Args:
        credentials: HTTP Bearer credentials from request
        db: Database session
        
    Returns:
        User instance if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            return None
        
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id_with_roles(user_id)
        
        if user is None or not user.is_active:
            return None
        
        return user
        
    except (TokenExpiredException, InvalidTokenException):
        return None


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current user only if they are a superuser.
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        Superuser instance
        
    Raises:
        HTTPException: 403 if user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required",
        )
    return current_user