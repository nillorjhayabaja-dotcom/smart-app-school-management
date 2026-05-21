"""
Pydantic schemas for user management endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base schema for user data."""
    
    email: EmailStr = Field(..., description="User's email address")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    is_superuser: bool = Field(default=False, description="Whether user is a superuser")
    role_ids: Optional[List[UUID]] = Field(None, description="List of role IDs to assign")


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response."""
    
    id: UUID
    is_superuser: bool
    is_verified: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    roles: List[str] = Field(default_factory=list, description="User's role names")
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    
    items: List[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int


class RoleAssignmentRequest(BaseModel):
    """Schema for assigning roles to a user."""
    
    role_ids: List[UUID] = Field(..., description="List of role IDs to assign")


class RoleResponse(BaseModel):
    """Schema for role information."""
    
    id: UUID
    name: str
    description: str
    is_system: bool
    level: int
    permissions: List[str] = Field(default_factory=list)
    
    class Config:
        from_attributes = True