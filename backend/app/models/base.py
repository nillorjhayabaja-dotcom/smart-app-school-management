"""
SQLAlchemy base model with common columns and utilities.

Provides a declarative base class with:
- Automatic primary key generation
- Created/updated timestamps
- Soft delete support
- Common utility methods
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, DateTime, String, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all database models."""

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, server_default="true"
    )

    def to_dict(self, exclude: set[str] | None = None) -> Dict[str, Any]:
        """
        Convert model to dictionary representation.
        
        Args:
            exclude: Set of field names to exclude from output
            
        Returns:
            Dictionary representation of the model
        """
        exclude = exclude or set()
        result = {}
        for column in self.__table__.columns:
            if column.name not in exclude:
                value = getattr(self, column.name)
                if isinstance(value, UUID):
                    value = str(value)
                elif isinstance(value, datetime):
                    value = value.isoformat()
                result[column.name] = value
        return result

    async def save(self, db: AsyncSession) -> "Base":
        """
        Save this instance to the database.
        
        Args:
            db: AsyncSession instance
            
        Returns:
            The saved instance
        """
        db.add(self)
        await db.flush()
        await db.refresh(self)
        return self

    async def delete(self, db: AsyncSession) -> None:
        """
        Delete this instance from the database.
        
        Args:
            db: AsyncSession instance
        """
        await db.delete(self)
        await db.flush()

    def update(self, **kwargs: Any) -> "Base":
        """
        Update model attributes and return self for chaining.
        
        Args:
            **kwargs: Attributes to update
            
        Returns:
            Self for method chaining
        """
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        return self