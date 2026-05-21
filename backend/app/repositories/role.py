"""
Role and Permission repositories with specialized query methods.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Permission, Role, RolePermission
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """
    Repository for Role model with specialized queries.
    
    Provides methods for:
    - Finding roles by name
    - Managing role permissions
    - Role hierarchy queries
    """
    
    model = Role
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def get_by_name(self, name: str) -> Optional[Role]:
        """
        Get role by name.
        
        Args:
            name: Role name
            
        Returns:
            Role instance or None
        """
        stmt = (
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload("permission"))
            .where(Role.name == name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_name_with_permissions(self, name: str) -> Optional[Role]:
        """
        Get role by name with permissions eagerly loaded.
        
        Args:
            name: Role name
            
        Returns:
            Role instance with permissions loaded or None
        """
        stmt = (
            select(Role)
            .options(
                selectinload(Role.role_permissions).selectinload("permission")
            )
            .where(Role.name == name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id_with_permissions(self, id: UUID) -> Optional[Role]:
        """
        Get role by ID with permissions eagerly loaded.
        
        Args:
            id: Role UUID
            
        Returns:
            Role instance with permissions loaded or None
        """
        stmt = (
            select(Role)
            .options(
                selectinload(Role.role_permissions).selectinload("permission")
            )
            .where(Role.id == id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_system_roles(self) -> List[Role]:
        """
        Get all system (built-in) roles.
        
        Returns:
            List of system roles
        """
        stmt = select(Role).where(Role.is_system == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_custom_roles(self) -> List[Role]:
        """
        Get all custom (non-system) roles.
        
        Returns:
            List of custom roles
        """
        stmt = select(Role).where(Role.is_system == False)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def add_permission(self, role_id: UUID, permission_id: UUID) -> Optional[RolePermission]:
        """
        Add a permission to a role.
        
        Args:
            role_id: Role UUID
            permission_id: Permission UUID
            
        Returns:
            Created RolePermission or None if already exists
        """
        # Check if already exists
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        
        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        self.db.add(role_permission)
        await self.db.flush()
        await self.db.refresh(role_permission)
        return role_permission
    
    async def remove_permission(self, role_id: UUID, permission_id: UUID) -> bool:
        """
        Remove a permission from a role.
        
        Args:
            role_id: Role UUID
            permission_id: Permission UUID
            
        Returns:
            True if removed, False if not found
        """
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        result = await self.db.execute(stmt)
        role_permission = result.scalar_one_or_none()
        
        if role_permission is None:
            return False
        
        await self.db.delete(role_permission)
        await self.db.flush()
        return True
    
    async def has_permission(self, role_id: UUID, permission_name: str) -> bool:
        """
        Check if a role has a specific permission.
        
        Args:
            role_id: Role UUID
            permission_name: Permission name to check
            
        Returns:
            True if role has the permission
        """
        stmt = (
            select(RolePermission)
            .join(Permission)
            .where(
                RolePermission.role_id == role_id,
                Permission.name == permission_name,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    async def name_exists(self, name: str, exclude_id: Optional[UUID] = None) -> bool:
        """
        Check if a role name exists, optionally excluding a specific role.
        
        Args:
            name: Role name to check
            exclude_id: Optional role ID to exclude
            
        Returns:
            True if name exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(Role).where(Role.name == name)
        if exclude_id:
            stmt = stmt.where(Role.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0


class PermissionRepository(BaseRepository[Permission]):
    """
    Repository for Permission model with specialized queries.
    
    Provides methods for:
    - Finding permissions by name or category
    - Managing permission categories
    """
    
    model = Permission
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def get_by_name(self, name: str) -> Optional[Permission]:
        """
        Get permission by name.
        
        Args:
            name: Permission name
            
        Returns:
            Permission instance or None
        """
        stmt = select(Permission).where(Permission.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_category(self, category: str) -> List[Permission]:
        """
        Get all permissions in a category.
        
        Args:
            category: Permission category
            
        Returns:
            List of permissions in the category
        """
        stmt = select(Permission).where(Permission.category == category)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_categories(self) -> List[str]:
        """
        Get all unique permission categories.
        
        Returns:
            List of category names
        """
        stmt = select(Permission.category).distinct()
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]
    
    async def name_exists(self, name: str, exclude_id: Optional[UUID] = None) -> bool:
        """
        Check if a permission name exists.
        
        Args:
            name: Permission name to check
            exclude_id: Optional permission ID to exclude
            
        Returns:
            True if name exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(Permission).where(Permission.name == name)
        if exclude_id:
            stmt = stmt.where(Permission.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0