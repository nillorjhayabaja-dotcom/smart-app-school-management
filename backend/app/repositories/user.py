"""
User repository with specialized query methods for user management.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Repository for User model with specialized queries.
    
    Provides methods for:
    - Finding users by email
    - Finding users by role
    - Managing user authentication state
    """
    
    model = User
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            email: User's email address
            
        Returns:
            User instance or None
        """
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_email_with_roles(self, email: str) -> Optional[User]:
        """
        Get user by email with roles eagerly loaded.
        
        Args:
            email: User's email address
            
        Returns:
            User instance with roles loaded or None
        """
        from sqlalchemy.orm import selectinload
        stmt = (
            select(User)
            .options(selectinload(User.user_roles).selectinload("role"))
            .where(User.email == email)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id_with_roles(self, id: UUID) -> Optional[User]:
        """
        Get user by ID with roles eagerly loaded.
        
        Args:
            id: User's UUID
            
        Returns:
            User instance with roles loaded or None
        """
        from sqlalchemy.orm import selectinload
        stmt = (
            select(User)
            .options(selectinload(User.user_roles).selectinload("role"))
            .where(User.id == id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_active_users(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """
        Get all active (not soft-deleted) users.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of active users
        """
        stmt = select(User).where(User.is_active == True).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_users_by_role(
        self,
        role_name: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """
        Get users with a specific role.
        
        Args:
            role_name: Name of the role
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of users with the specified role
        """
        from app.models.role import Role
        from app.models.user_role import UserRole
        from sqlalchemy.orm import selectinload
        
        stmt = (
            select(User)
            .join(UserRole)
            .join(Role)
            .where(Role.name == role_name)
            .options(selectinload(User.user_roles).selectinload("role"))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def email_exists(self, email: str, exclude_id: Optional[UUID] = None) -> bool:
        """
        Check if an email exists, optionally excluding a specific user.
        
        Args:
            email: Email to check
            exclude_id: Optional user ID to exclude from check
            
        Returns:
            True if email exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(User).where(User.email == email)
        if exclude_id:
            stmt = stmt.where(User.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0
    
    async def get_superusers(self) -> List[User]:
        """
        Get all superuser accounts.
        
        Returns:
            List of superuser users
        """
        stmt = select(User).where(User.is_superuser == True)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def search(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """
        Search users by name or email.
        
        Args:
            query: Search query string
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching users
        """
        search = f"%{query}%"
        stmt = (
            select(User)
            .where(
                (User.first_name.ilike(search)) |
                (User.last_name.ilike(search)) |
                (User.email.ilike(search))
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())