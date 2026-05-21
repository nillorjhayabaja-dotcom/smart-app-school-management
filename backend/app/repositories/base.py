"""
Base repository with common CRUD operations.

Provides a generic repository pattern for database operations with:
- Async session management
- Common CRUD operations
- Type-safe generic methods
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic repository base class with common CRUD operations.
    
    This repository provides a foundation for data access with async support,
    type safety, and common query patterns.
    
    Usage:
        class UserRepository(BaseRepository[User]):
            model = User
            
        repo = UserRepository(db)
        user = await repo.get_by_id(user_id)
    """
    
    model: Type[ModelType]
    
    def __init__(self, db: AsyncSession):
        """
        Initialize repository with database session.
        
        Args:
            db: AsyncSession instance
        """
        self.db = db
    
    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            id: Primary key UUID
            
        Returns:
            Model instance or None if not found
        """
        result = await self.db.get(self.model, id)
        return result
    
    async def get_by_ids(self, ids: List[UUID]) -> List[ModelType]:
        """
        Get multiple records by IDs.
        
        Args:
            ids: List of primary key UUIDs
            
        Returns:
            List of model instances
        """
        stmt = select(self.model).where(self.model.id.in_(ids))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        descending: bool = False,
    ) -> List[ModelType]:
        """
        Get all records with pagination and optional ordering.
        
        Args:
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            order_by: Column name to order by
            descending: Whether to order descending
            
        Returns:
            List of model instances
        """
        stmt = select(self.model)
        
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            stmt = stmt.order_by(column.desc() if descending else column.asc())
        
        if skip:
            stmt = stmt.offset(skip)
        if limit:
            stmt = stmt.limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count records matching optional filters.
        
        Args:
            filters: Optional dictionary of column=value filters
            
        Returns:
            Count of matching records
        """
        stmt = select(func.count()).select_from(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        
        result = await self.db.execute(stmt)
        return result.scalar() or 0
    
    async def create(self, attributes: Dict[str, Any]) -> ModelType:
        """
        Create a new record.
        
        Args:
            attributes: Dictionary of attributes to set
            
        Returns:
            Created model instance
        """
        model = self.model(**attributes)
        self.db.add(model)
        await self.db.flush()
        await self.db.refresh(model)
        return model
    
    async def update(
        self,
        id: UUID,
        attributes: Dict[str, Any],
    ) -> Optional[ModelType]:
        """
        Update an existing record.
        
        Args:
            id: Primary key UUID
            attributes: Dictionary of attributes to update
            
        Returns:
            Updated model instance or None if not found
        """
        model = await self.get_by_id(id)
        if model is None:
            return None
        
        for key, value in attributes.items():
            if hasattr(model, key):
                setattr(model, key, value)
        
        await self.db.flush()
        await self.db.refresh(model)
        return model
    
    async def delete(self, id: UUID) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: Primary key UUID
            
        Returns:
            True if deleted, False if not found
        """
        model = await self.get_by_id(id)
        if model is None:
            return False
        
        await self.db.delete(model)
        await self.db.flush()
        return True
    
    async def exists(self, id: UUID) -> bool:
        """
        Check if a record exists.
        
        Args:
            id: Primary key UUID
            
        Returns:
            True if exists, False otherwise
        """
        stmt = select(func.count()).select_from(self.model).where(self.model.id == id)
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0
    
    async def find_by(
        self,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        descending: bool = False,
    ) -> List[ModelType]:
        """
        Find records matching filters.
        
        Args:
            filters: Dictionary of column=value filters
            skip: Number of records to skip
            limit: Maximum number of records to return
            order_by: Column name to order by
            descending: Whether to order descending
            
        Returns:
            List of matching model instances
        """
        stmt = select(self.model)
        
        for key, value in filters.items():
            if hasattr(self.model, key):
                stmt = stmt.where(getattr(self.model, key) == value)
        
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            stmt = stmt.order_by(column.desc() if descending else column.asc())
        
        if skip:
            stmt = stmt.offset(skip)
        if limit:
            stmt = stmt.limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_first(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        descending: bool = False,
    ) -> Optional[ModelType]:
        """
        Get the first record matching optional filters.
        
        Args:
            filters: Optional dictionary of filters
            order_by: Column name to order by
            descending: Whether to order descending
            
        Returns:
            Model instance or None
        """
        stmt = select(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)
        
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            stmt = stmt.order_by(column.desc() if descending else column.asc())
        
        stmt = stmt.limit(1)
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()