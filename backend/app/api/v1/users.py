"""
User management endpoints for CRUD operations.

Provides endpoints for:
- Listing, creating, reading, updating, and deleting users
- Assigning and removing roles
- Searching users
"""

import math
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import async_session_factory
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.password_handler import PasswordHandler
from app.middleware.auth import get_current_user
from app.middleware.rbac import require_permission
from app.models.user import User
from app.repositories.role import RoleRepository
from app.repositories.user import UserRepository
from app.schemas.user import (
    RoleAssignmentRequest,
    RoleResponse,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


def get_dependency_db(request: Request) -> AsyncSession:
    """Get database session from request state or create new one."""
    if hasattr(request.state, "db"):
        return request.state.db
    return async_session_factory()


@router.get("", response_model=UserListResponse)
async def list_users(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search by name or email"),
    role: str = Query(None, description="Filter by role name"),
    is_active: bool = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_user),
) -> UserListResponse:
    """
    List all users with pagination and filtering.
    
    Args:
        request: FastAPI request object
        page: Page number (starts at 1)
        page_size: Number of items per page
        search: Optional search query for name/email
        role: Optional role name filter
        is_active: Optional active status filter
        current_user: Currently authenticated user
        
    Returns:
        Paginated list of users
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    # Calculate offset
    skip = (page - 1) * page_size
    
    # Get users based on filters
    if search:
        users = await user_repo.search(search, skip=skip, limit=page_size)
        total = await user_repo.count()  # Approximate total
    elif role:
        users = await user_repo.get_users_by_role(role, skip=skip, limit=page_size)
        total = await user_repo.count()
    elif is_active is not None:
        users = await user_repo.find_by(
            {"is_active": is_active},
            skip=skip,
            limit=page_size,
        )
        total = await user_repo.count({"is_active": is_active})
    else:
        users = await user_repo.get_all(skip=skip, limit=page_size)
        total = await user_repo.count()
    
    # Calculate total pages
    pages = math.ceil(total / page_size) if total > 0 else 1
    
    return UserListResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Create a new user.
    
    Args:
        request: FastAPI request object
        user_data: User creation data
        current_user: Currently authenticated user
        
    Returns:
        Created user
        
    Raises:
        HTTPException: 400 if email already exists
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    # Check if email already exists
    if await user_repo.email_exists(user_data.email):
        raise ConflictException(
            message="Email already registered",
            detail=f"A user with email {user_data.email} already exists",
        )
    
    # Create user
    user = await user_repo.create({
        "email": user_data.email,
        "password_hash": PasswordHandler.hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "is_superuser": user_data.is_superuser,
        "is_verified": True,  # Auto-verify for now
        "is_active": True,
    })
    
    # Assign roles if provided
    if user_data.role_ids:
        role_repo = RoleRepository(db)
        for role_id in user_data.role_ids:
            role = await role_repo.get_by_id(role_id)
            if role is None:
                raise NotFoundException(
                    message="Role not found",
                    detail=f"Role with id {role_id} not found",
                )
            
            from app.models.user_role import UserRole
            user_role = UserRole(user_id=user.id, role_id=role.id)
            db.add(user_role)
        
        await db.flush()
    
    await db.refresh(user)
    
    # Load roles for response
    user_with_roles = await user_repo.get_by_id_with_roles(user.id)
    return user_with_roles


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    request: Request,
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Get a specific user by ID.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        current_user: Currently authenticated user
        
    Returns:
        User information
        
    Raises:
        HTTPException: 404 if user not found
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_id_with_roles(user_id)
    
    if user is None:
        raise NotFoundException(
            message="User not found",
            detail=f"User with id {user_id} not found",
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    request: Request,
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Update a user.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        user_data: Update data
        current_user: Currently authenticated user
        
    Returns:
        Updated user
        
    Raises:
        HTTPException: 404 if user not found
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_id(user_id)
    
    if user is None:
        raise NotFoundException(
            message="User not found",
            detail=f"User with id {user_id} not found",
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(user, field, value)
    
    await db.flush()
    await db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: Request,
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a user.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        current_user: Currently authenticated user
        
    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if trying to delete self
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    # Prevent self-deletion
    if str(current_user.id) == user_id:
        raise BadRequestException(
            message="Cannot delete yourself",
            detail="Users cannot delete their own account",
        )
    
    user = await user_repo.get_by_id(user_id)
    
    if user is None:
        raise NotFoundException(
            message="User not found",
            detail=f"User with id {user_id} not found",
        )
    
    await user_repo.delete(user_id)


@router.get("/{user_id}/roles", response_model=List[RoleResponse])
async def get_user_roles(
    request: Request,
    user_id: str,
    current_user: User = Depends(get_current_user),
) -> List[RoleResponse]:
    """
    Get roles assigned to a user.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        current_user: Currently authenticated user
        
    Returns:
        List of user's roles
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    
    user = await user_repo.get_by_id_with_roles(user_id)
    
    if user is None:
        raise NotFoundException(
            message="User not found",
            detail=f"User with id {user_id} not found",
        )
    
    return [
        RoleResponse(
            id=ur.role.id,
            name=ur.role.name,
            description=ur.role.description,
            is_system=ur.role.is_system,
            level=ur.role.level,
            permissions=[p.name for p in ur.role.permissions],
        )
        for ur in user.user_roles
    ]


@router.post("/{user_id}/roles", response_model=List[RoleResponse])
async def assign_roles(
    request: Request,
    user_id: str,
    role_data: RoleAssignmentRequest,
    current_user: User = Depends(get_current_user),
) -> List[RoleResponse]:
    """
    Assign roles to a user.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        role_data: List of role IDs to assign
        current_user: Currently authenticated user
        
    Returns:
        Updated list of user's roles
    """
    db: AsyncSession = get_dependency_db(request)
    user_repo = UserRepository(db)
    role_repo = RoleRepository(db)
    
    user = await user_repo.get_by_id_with_roles(user_id)
    
    if user is None:
        raise NotFoundException(
            message="User not found",
            detail=f"User with id {user_id} not found",
        )
    
    # Get existing role IDs
    existing_role_ids = {ur.role_id for ur in user.user_roles}
    
    # Add new roles
    for role_id in role_data.role_ids:
        if role_id not in existing_role_ids:
            role = await role_repo.get_by_id(role_id)
            if role is None:
                raise NotFoundException(
                    message="Role not found",
                    detail=f"Role with id {role_id} not found",
                )
            
            from app.models.user_role import UserRole
            user_role = UserRole(user_id=user.id, role_id=role.id)
            db.add(user_role)
    
    await db.flush()
    await db.refresh(user)
    
    return [
        RoleResponse(
            id=ur.role.id,
            name=ur.role.name,
            description=ur.role.description,
            is_system=ur.role.is_system,
            level=ur.role.level,
            permissions=[p.name for p in ur.role.permissions],
        )
        for ur in user.user_roles
    ]


@router.delete("/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role(
    request: Request,
    user_id: str,
    role_id: str,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Remove a role from a user.
    
    Args:
        request: FastAPI request object
        user_id: User UUID
        role_id: Role UUID to remove
        current_user: Currently authenticated user
    """
    db: AsyncSession = get_dependency_db(request)
    
    from app.models.user_role import UserRole
    from sqlalchemy import and_
    
    stmt = (
        UserRole.__table__.delete().where(
            and_(
                UserRole.__table__.c.user_id == user_id,
                UserRole.__table__.c.role_id == role_id,
            )
        )
    )
    await db.execute(stmt)
    await db.flush()