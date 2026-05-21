"""
Role and Permission models for RBAC (Role-Based Access Control).

These models implement a flexible permission system where:
- Permissions represent individual actions that can be performed
- Roles are collections of permissions
- Users are assigned roles through the UserRole relationship
"""

from typing import TYPE_CHECKING, List
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String, Table, Column, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user_role import UserRole


class Permission(Base):
    """
    Permission model representing individual actions in the system.
    
    Permissions are the most granular level of access control.
    Examples: "users:create", "users:read", "users:update", "users:delete"
    
    Attributes:
        name: Unique permission identifier (e.g., "users:create")
        description: Human-readable description of the permission
        category: Grouping category (e.g., "users", "employees", "reports")
    """

    __tablename__ = "permissions"

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    # Relationships
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        back_populates="permission",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name={self.name})>"


class Role(Base):
    """
    Role model representing a collection of permissions.
    
    Roles are assigned to users to grant them access to system features.
    Common roles: "admin", "hr_manager", "teacher", "viewer"
    
    Attributes:
        name: Unique role identifier (e.g., "admin")
        description: Human-readable description of the role
        is_system: Whether this is a built-in system role (cannot be deleted)
        level: Hierarchy level for role precedence (higher = more authority)
    """

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
    )
    level: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        server_default="0",
    )

    # Relationships
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    user_roles: Mapped[List["UserRole"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def permissions(self) -> List[Permission]:
        """Get list of permissions for this role."""
        return [rp.permission for rp in self.role_permissions]

    @property
    def permission_names(self) -> List[str]:
        """Get list of permission names for this role."""
        return [p.name for p in self.permissions]

    def has_permission(self, permission_name: str) -> bool:
        """
        Check if this role has a specific permission.
        
        Args:
            permission_name: Name of the permission to check
            
        Returns:
            True if the role has the permission
        """
        return any(p.name == permission_name for p in self.permissions)

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name})>"


class RolePermission(Base):
    """
    Association model linking roles to permissions.
    
    This model enables many-to-many relationship between roles and permissions,
    allowing fine-grained control over which permissions each role has.
    """

    __tablename__ = "role_permissions"

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission_id: Mapped[UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    role: Mapped["Role"] = relationship(
        back_populates="role_permissions",
        foreign_keys=[role_id],
    )
    permission: Mapped["Permission"] = relationship(
        back_populates="role_permissions",
        foreign_keys=[permission_id],
    )

    def __repr__(self) -> str:
        return f"<RolePermission(role_id={self.role_id}, permission_id={self.permission_id})>"