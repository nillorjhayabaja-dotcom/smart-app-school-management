"""
Department repository with specialized query methods.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.department import Department
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    """
    Repository for Department model with specialized queries.
    
    Provides methods for:
    - Finding departments by code or name
    - Hierarchical department queries
    - Department statistics
    """
    
    model = Department
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def get_by_code(self, code: str) -> Optional[Department]:
        """
        Get department by code.
        
        Args:
            code: Department code
            
        Returns:
            Department instance or None
        """
        stmt = select(Department).where(Department.code == code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_name(self, name: str) -> Optional[Department]:
        """
        Get department by name.
        
        Args:
            name: Department name
            
        Returns:
            Department instance or None
        """
        stmt = select(Department).where(Department.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id_with_employees(self, id: UUID) -> Optional[Department]:
        """
        Get department by ID with employees eagerly loaded.
        
        Args:
            id: Department UUID
            
        Returns:
            Department instance with employees loaded or None
        """
        stmt = (
            select(Department)
            .options(selectinload(Department.employees))
            .where(Department.id == id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_root_departments(self) -> List[Department]:
        """
        Get all top-level departments (no parent).
        
        Returns:
            List of root departments
        """
        stmt = select(Department).where(Department.parent_id.is_(None))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_children(self, parent_id: UUID) -> List[Department]:
        """
        Get all child departments of a parent.
        
        Args:
            parent_id: Parent department UUID
            
        Returns:
            List of child departments
        """
        stmt = select(Department).where(Department.parent_id == parent_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_hierarchy(self, department_id: UUID) -> List[Department]:
        """
        Get the full hierarchy from root to a department.
        
        Args:
            department_id: Department UUID
            
        Returns:
            List of departments from root to target
        """
        # First get the department
        dept = await self.get_by_id(department_id)
        if not dept:
            return []
        
        hierarchy = [dept]
        current = dept
        
        # Walk up the tree
        while current.parent_id:
            parent = await self.get_by_id(current.parent_id)
            if not parent:
                break
            hierarchy.insert(0, parent)
            current = parent
        
        return hierarchy
    
    async def code_exists(self, code: str, exclude_id: Optional[UUID] = None) -> bool:
        """
        Check if a department code exists.
        
        Args:
            code: Department code to check
            exclude_id: Optional department ID to exclude
            
        Returns:
            True if code exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(Department).where(Department.code == code)
        if exclude_id:
            stmt = stmt.where(Department.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0
    
    async def get_departments_with_employee_count(self) -> List[dict]:
        """
        Get all departments with their employee counts.
        
        Returns:
            List of dicts with department info and employee count
        """
        from sqlalchemy import func
        
        stmt = (
            select(
                Department.id,
                Department.name,
                Department.code,
                func.count(Department.employees).label("employee_count")
            )
            .outerjoin(Department.employees)
            .group_by(Department.id)
        )
        result = await self.db.execute(stmt)
        return [
            {
                "id": row.id,
                "name": row.name,
                "code": row.code,
                "employee_count": row.employee_count,
            }
            for row in result.all()
        ]
    
    async def search(self, query: str) -> List[Department]:
        """
        Search departments by name or code.
        
        Args:
            query: Search query string
            
        Returns:
            List of matching departments
        """
        search = f"%{query}%"
        stmt = select(Department).where(
            (Department.name.ilike(search)) |
            (Department.code.ilike(search))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())