"""
UserRole association model linking users to roles.

This model implements the many-to-many relationship between users and roles,
allowing users to have multiple roles with optional assignment metadata.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.role import Role


class UserRole(Base):
    """
    Association model linking users to roles.
    
    This model allows users to have multiple roles and tracks:
    - When the role was assigned
    - Who assigned the role (optional)
    - Any notes about the assignment
    
    Attributes:
        user_id: Foreign key to the user
        role_id: Foreign key to the role
        assigned_by: Optional user ID who made the assignment
        assigned_at: Timestamp when the role was assigned
        notes: Optional notes about the assignment
    """

    __tablename__ = "user_roles"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[str] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        back_populates="user_roles",
        foreign_keys=[user_id],
    )
    role: Mapped["Role"] = relationship(
        back_populates="user_roles",
    )
    assigned_by_user: Mapped[Optional["User"]] = relationship(
        foreign_keys=[assigned_by],
    )

    def __repr__(self) -> str:
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"