"""
Pydantic schemas for authentication endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Request schema for login endpoint."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, description="User's password")


class TokenResponse(BaseModel):
    """Response schema for token endpoints."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type (bearer)")
    expires_in: int = Field(..., description="Access token expiration in seconds")


class RefreshRequest(BaseModel):
    """Request schema for refresh token endpoint."""
    
    refresh_token: str = Field(..., description="Valid refresh token")


class UserResponse(BaseModel):
    """Response schema for user information."""
    
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    is_superuser: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    roles: List[str] = Field(default_factory=list, description="User's role names")
    
    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    """Request schema for password change."""
    
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class PasswordResetRequest(BaseModel):
    """Request schema for password reset initiation."""
    
    email: EmailStr = Field(..., description="User's email address")


class PasswordResetConfirmRequest(BaseModel):
    """Request schema for password reset confirmation."""
    
    token: str = Field(..., description="Reset token from email")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")