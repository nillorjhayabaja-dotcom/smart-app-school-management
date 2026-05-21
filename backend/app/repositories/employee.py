"""
Employee repository with specialized query methods.
"""

from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.employee import Employee
from app.repositories.base import BaseRepository


class EmployeeRepository(BaseRepository[Employee]):
    """
    Repository for Employee model with specialized queries.
    
    Provides methods for:
    - Finding employees by various criteria
    - Department-based queries
    - Status and analytics queries
    """
    
    model = Employee
    
    def __init__(self, db: AsyncSession):
        super().__init__(db)
    
    async def get_by_employee_number(self, employee_number: str) -> Optional[Employee]:
        """
        Get employee by employee number.
        
        Args:
            employee_number: Employee's unique number
            
        Returns:
            Employee instance or None
        """
        stmt = select(Employee).where(Employee.employee_number == employee_number)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[Employee]:
        """
        Get employee by email.
        
        Args:
            email: Employee's email
            
        Returns:
            Employee instance or None
        """
        stmt = select(Employee).where(Employee.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_user_id(self, user_id: UUID) -> Optional[Employee]:
        """
        Get employee by associated user ID.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Employee instance or None
        """
        stmt = select(Employee).where(Employee.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_department(
        self,
        department_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Employee]:
        """
        Get all employees in a department.
        
        Args:
            department_id: Department UUID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of employees in the department
        """
        stmt = (
            select(Employee)
            .where(Employee.department_id == department_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_active_employees(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Employee]:
        """
        Get all active employees.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of active employees
        """
        stmt = (
            select(Employee)
            .where(Employee.status == "active")
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Employee]:
        """
        Get employees by status.
        
        Args:
            status: Employment status
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of employees with the status
        """
        stmt = (
            select(Employee)
            .where(Employee.status == status)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_high_risk_employees(self) -> List[Employee]:
        """
        Get employees with high retention risk.
        
        Returns:
            List of high-risk employees
        """
        stmt = select(Employee).where(Employee.retention_risk == "high")
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_retention_risk(
        self,
        risk_level: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Employee]:
        """
        Get employees by retention risk level.
        
        Args:
            risk_level: Risk level (low, medium, high)
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of employees with the risk level
        """
        stmt = (
            select(Employee)
            .where(Employee.retention_risk == risk_level)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def search(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Employee]:
        """
        Search employees by name, email, or employee number.
        
        Args:
            query: Search query string
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching employees
        """
        search = f"%{query}%"
        stmt = (
            select(Employee)
            .where(
                (Employee.first_name.ilike(search)) |
                (Employee.last_name.ilike(search)) |
                (Employee.email.ilike(search)) |
                (Employee.employee_number.ilike(search))
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def employee_number_exists(
        self,
        employee_number: str,
        exclude_id: Optional[UUID] = None,
    ) -> bool:
        """
        Check if an employee number exists.
        
        Args:
            employee_number: Employee number to check
            exclude_id: Optional employee ID to exclude
            
        Returns:
            True if employee number exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(Employee).where(
            Employee.employee_number == employee_number
        )
        if exclude_id:
            stmt = stmt.where(Employee.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0
    
    async def email_exists(
        self,
        email: str,
        exclude_id: Optional[UUID] = None,
    ) -> bool:
        """
        Check if an employee email exists.
        
        Args:
            email: Email to check
            exclude_id: Optional employee ID to exclude
            
        Returns:
            True if email exists
        """
        from sqlalchemy import func
        
        stmt = select(func.count()).select_from(Employee).where(Employee.email == email)
        if exclude_id:
            stmt = stmt.where(Employee.id != exclude_id)
        
        result = await self.db.execute(stmt)
        return (result.scalar() or 0) > 0
    
    async def get_statistics(self) -> dict:
        """
        Get employee statistics.
        
        Returns:
            Dictionary with various employee statistics
        """
        from sqlalchemy import func
        
        # Total employees
        total_stmt = select(func.count()).select_from(Employee)
        total_result = await self.db.execute(total_stmt)
        total = total_result.scalar() or 0
        
        # Active employees
        active_stmt = select(func.count()).select_from(Employee).where(
            Employee.status == "active"
        )
        active_result = await self.db.execute(active_stmt)
        active = active_result.scalar() or 0
        
        # By retention risk
        high_risk_stmt = select(func.count()).select_from(Employee).where(
            Employee.retention_risk == "high"
        )
        high_risk_result = await self.db.execute(high_risk_stmt)
        high_risk = high_risk_result.scalar() or 0
        
        # Average workload
        avg_workload_stmt = select(func.avg(Employee.workload))
        avg_workload_result = await self.db.execute(avg_workload_stmt)
        avg_workload = avg_workload_result.scalar() or 0.0
        
        # Average performance
        avg_performance_stmt = select(func.avg(Employee.performance))
        avg_performance_result = await self.db.execute(avg_performance_stmt)
        avg_performance = avg_performance_result.scalar() or 0.0
        
        return {
            "total": total,
            "active": active,
            "high_risk": high_risk,
            "avg_workload": round(avg_workload, 1),
            "avg_performance": round(avg_performance, 1),
        }
    
    async def get_by_hire_date_range(
        self,
        start_date: date,
        end_date: date,
    ) -> List[Employee]:
        """
        Get employees hired within a date range.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            
        Returns:
            List of employees hired in the range
        """
        stmt = select(Employee).where(
            Employee.hire_date >= start_date,
            Employee.hire_date <= end_date,
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())