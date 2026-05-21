"""
Role-Based Access Control (RBAC) Middleware.

Provides FastAPI dependencies for:
- Checking if user has a specific role
- Checking if user has a specific permission
- Combining role and permission checks
"""

from typing import Callable, List, Union

from fastapi import Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.models.user import User


def require_role(
    roles: Union[str, List[str]],
    require_all: bool = False,
) -> Callable:
    """
    Dependency factory for role-based access control.
    
    Args:
        roles: Single role name or list of role names to check
        require_all: If True, user must have ALL roles. If False, ANY role.
        
    Returns:
        FastAPI dependency function
        
    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint():
            pass
            
        @router.get("/manager", dependencies=[Depends(require_role(["manager", "admin"]))])
        async def manager_endpoint():
            pass
    """
    if isinstance(roles, str):
        roles = [roles]
    
    async def role_checker(current_user: User = Depends(get_current_user)) -> bool:
        """Check if current user has required role(s)."""
        user_roles = {ur.role.name for ur in current_user.user_roles}
        
        if require_all:
            # User must have ALL specified roles
            if not set(roles).issubset(user_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires all of these roles: {', '.join(roles)}",
                )
        else:
            # User must have ANY of the specified roles
            if not user_roles.intersection(set(roles)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of these roles: {', '.join(roles)}",
                )
        
        return True
    
    return role_checker


def require_permission(
    permissions: Union[str, List[str]],
    require_all: bool = False,
) -> Callable:
    """
    Dependency factory for permission-based access control.
    
    Args:
        permissions: Single permission name or list of permission names
        require_all: If True, user must have ALL permissions. If False, ANY permission.
        
    Returns:
        FastAPI dependency function
        
    Usage:
        @router.post("/users", dependencies=[Depends(require_permission("users:create"))])
        async def create_user():
            pass
    """
    if isinstance(permissions, str):
        permissions = [permissions]
    
    async def permission_checker(current_user: User = Depends(get_current_user)) -> bool:
        """Check if current user has required permission(s)."""
        # Collect all permissions from user's roles
        user_permissions = set()
        for user_role in current_user.user_roles:
            for permission in user_role.role.permissions:
                user_permissions.add(permission.name)
        
        # Superusers bypass all permission checks
        if current_user.is_superuser:
            return True
        
        if require_all:
            # User must have ALL specified permissions
            if not set(permissions).issubset(user_permissions):
                missing = set(permissions) - user_permissions
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing permissions: {', '.join(missing)}",
                )
        else:
            # User must have ANY of the specified permissions
            if not user_permissions.intersection(set(permissions)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of these permissions: {', '.join(permissions)}",
                )
        
        return True
    
    return permission_checker


def require_roles_and_permissions(
    roles: Union[str, List[str], None] = None,
    permissions: Union[str, List[str], None] = None,
) -> Callable:
    """
    Dependency factory combining role and permission checks.
    
    User must pass BOTH checks if both are provided.
    
    Args:
        roles: Optional role(s) to check
        permissions: Optional permission(s) to check
        
    Returns:
        FastAPI dependency function
    """
    role_dep = require_role(roles) if roles else None
    perm_dep = require_permission(permissions) if permissions else None
    
    async def combined_checker(
        current_user: User = Depends(get_current_user),
    ) -> bool:
        if role_dep:
            await role_dep(current_user=current_user)
        if perm_dep:
            await perm_dep(current_user=current_user)
        return True
    
    return combined_checker


# Pre-built dependencies for common use cases
require_admin = require_role("admin")
require_manager = require_role("manager")
require_teacher = require_role("teacher")
require_viewer = require_role("viewer")

# Permission-based shortcuts
require_user_management = require_permission(["users:create", "users:read", "users:update", "users:delete"])
require_employee_management = require_permission(["employees:create", "employees:read", "employees:update", "employees:delete"])
require_reports_access = require_permission("reports:read")