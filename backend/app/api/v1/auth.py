"""
Authentication endpoints for login, logout, refresh, and user management.

Provides real authentication with:
- JWT token generation and validation
- Password verification using Argon2
- Token refresh mechanism
- User session management
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session_factory
from app.core.jwt_handler import create_access_token, create_refresh_token, decode_refresh_token
from app.core.password_handler import PasswordHandler
from app.core.settings import settings
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter()


def get_dependency_db(request: Request) -> AsyncSession:
    """Get database session from request state or create new one."""
    # Check if session is already in request state (set by middleware)
    if hasattr(request.state, "db"):
        return request.state.db
    # Create new session
    return async_session_factory()


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
) -> TokenResponse:
    """
    Authenticate user and return JWT tokens.
    
    This endpoint:
    1. Validates user credentials (email + password)
    2. Updates last login timestamp
    3. Generates access and refresh tokens
    4. Returns tokens for authenticated requests
    
    Args:
        request: FastAPI request object
        login_data: Email and password from request body
        
    Returns:
        TokenResponse with access and refresh tokens
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    db: AsyncSession = get_dependency_db(request)
    
    # Get user by email with roles loaded
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email_with_roles(login_data.email)
    
    if user is None:
        # Use same message to prevent user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    # Check if user is locked
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is temporarily locked due to too many failed login attempts",
        )
    
    # Verify password
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not PasswordHandler.verify_password(login_data.password, user.password_hash):
        # Increment failed login attempts
        user.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            from datetime import timedelta
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Clear failed login attempts on success
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.locked_until = None
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    # Generate tokens
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshRequest,
) -> TokenResponse:
    """
    Refresh access token using a valid refresh token.
    
    This endpoint allows clients to obtain a new access token
    without requiring the user to re-authenticate.
    
    Args:
        request: FastAPI request object
        refresh_data: Refresh token from request body
        
    Returns:
        TokenResponse with new access token
        
    Raises:
        HTTPException: 401 if refresh token is invalid or expired
    """
    db: AsyncSession = get_dependency_db(request)
    
    try:
        payload = decode_refresh_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify user still exists and is active
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate new access token
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Logout the current user.
    
    Currently, this is a no-op since JWT tokens are stateless.
    In a production system, you would:
    - Add the token to a blacklist (Redis/database)
    - Or use short-lived tokens with refresh rotation
    
    Args:
        request: FastAPI request object
        current_user: Currently authenticated user
        
    Returns:
        Success message
    """
    # TODO: Implement token blacklisting with Redis
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get current authenticated user's information.
    
    Args:
        request: FastAPI request object
        current_user: Currently authenticated user
        
    Returns:
        UserResponse with user profile information
    """
    # Get role names
    role_names = [ur.role.name for ur in current_user.user_roles]
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        full_name=current_user.full_name,
        is_superuser=current_user.is_superuser,
        is_verified=current_user.is_verified,
        last_login=current_user.last_login,
        roles=role_names,
    )


@router.put("/password")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Change the current user's password.
    
    Args:
        request: FastAPI request object
        password_data: Current and new password
        current_user: Currently authenticated user
        
    Returns:
        Success message
        
    Raises:
        HTTPException: 400 if current password is incorrect
    """
    db: AsyncSession = get_dependency_db(request)
    
    # Verify current password
    if current_user.password_hash is None or not PasswordHandler.verify_password(
        password_data.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Update password
    current_user.password_hash = PasswordHandler.hash_password(password_data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}