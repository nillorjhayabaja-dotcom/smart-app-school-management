"""
Repositories package for data access layer.

Provides typed repositories for each model with specialized query methods.
"""

from app.repositories.base import BaseRepository
from app.repositories.user import UserRepository
from app.repositories.role import RoleRepository, PermissionRepository
from app.repositories.department import DepartmentRepository
from app.repositories.employee import EmployeeRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "RoleRepository",
    "PermissionRepository",
    "DepartmentRepository",
    "EmployeeRepository",
]