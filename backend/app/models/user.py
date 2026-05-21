"""
User model for authentication and user management.

The User model represents authenticated users who can access the system.
Each user has a unique email and is associated with one or more roles.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user_role import UserRole
    from app.models.employee import Employee


class User(Base):
    """
    User model for system authentication and authorization.
    
    Attributes:
        email: Unique email address used for login
        password_hash: Argon2 hashed password
        first_name: User's first name
        last_name: User's last name
        phone: Optional phone number
        avatar_url: Optional URL to user's avatar image
        last_login: Timestamp of last successful login
        is_verified: Whether the user's email has been verified
        is_superuser: Whether the user has superuser privileges
        failed_login_attempts: Count of consecutive failed login attempts
        locked_until: Timestamp when account lock expires (if locked)
    """

    __tablename__ = "users"

    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    # Profile fields
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Security fields
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
    )
    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        server_default="0",
    )
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user_roles: Mapped[List["UserRole"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    employee: Mapped[Optional["Employee"]] = relationship(
        back_populates="user",
        uselist=False,
    )

    @property
    def full_name(self) -> str:
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_locked(self) -> bool:
        """Check if the user account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.now(timezone.utc) < self.locked_until

    def to_dict(self, exclude: set[str] | None = None) -> dict:
        """
        Convert user to dictionary, excluding sensitive fields by default.
        
        Args:
            exclude: Additional fields to exclude
            
        Returns:
            Dictionary representation safe for API responses
        """
        if exclude is None:
            exclude = set()
        # Always exclude sensitive fields
        exclude = exclude | {"password_hash", "failed_login_attempts", "locked_until"}
        return super().to_dict(exclude)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"