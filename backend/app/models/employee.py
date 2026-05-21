"""
Employee model for staff management.

The Employee model represents staff members (teachers, administrators, etc.)
and contains employment-related information separate from authentication.
"""

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.user import User


class Employee(Base):
    """
    Employee model representing staff members.
    
    This model stores employment-related information for all staff members
    including teachers, administrators, and support staff.
    
    Attributes:
        employee_number: Unique employee identifier (e.g., "EMP-001")
        user_id: Optional link to User model if employee has system access
        first_name: Employee's first name
        last_name: Employee's last name
        email: Work email address
        phone: Work phone number
        department_id: Foreign key to department
        position: Job title/position
        employment_type: Full-time, Part-time, Contract, etc.
        hire_date: Date of hire
        termination_date: Date of termination (if applicable)
        salary: Annual salary
        status: Current employment status (active, on_leave, terminated)
        address: Home address
        date_of_birth: Employee's date of birth
        emergency_contact_name: Name of emergency contact
        emergency_contact_phone: Emergency contact phone number
        workload: Current workload percentage (0-100)
        performance: Performance rating (0-100)
        retention_risk: Risk level for retention (low, medium, high)
    """

    __tablename__ = "employees"

    # Basic information
    employee_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    # Employment information
    department_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    position: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    employment_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="full_time",
    )
    hire_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today,
    )
    termination_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )
    salary: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="active",
        index=True,
    )

    # Personal information
    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    # Emergency contact
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
    )
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    # Analytics fields (for workload, performance, retention)
    workload: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        server_default="0",
    )
    performance: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        server_default="0",
    )
    retention_risk: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        server_default="low",
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        back_populates="employee",
        uselist=False,
    )
    department: Mapped[Optional["Department"]] = relationship(
        back_populates="employees",
        foreign_keys=[department_id],
    )
    headed_department: Mapped[Optional["Department"]] = relationship(
        back_populates="head",
        foreign_keys="[Department.head_id]",
        uselist=False,
    )

    @property
    def full_name(self) -> str:
        """Return the employee's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active_employee(self) -> bool:
        """Check if the employee is currently active."""
        return self.status == "active" and self.termination_date is None

    @property
    def years_of_service(self) -> float:
        """Calculate years of service."""
        if self.hire_date is None:
            return 0.0
        today = date.today()
        years = today.year - self.hire_date.year
        if (today.month, today.day) < (self.hire_date.month, self.hire_date.day):
            years -= 1
        return float(years)

    def to_dict(self, exclude: set[str] | None = None) -> dict:
        """
        Convert employee to dictionary, excluding sensitive fields by default.
        
        Args:
            exclude: Additional fields to exclude
            
        Returns:
            Dictionary representation safe for API responses
        """
        if exclude is None:
            exclude = set()
        # Exclude sensitive personal information by default
        exclude = exclude | {
            "salary", "address", "date_of_birth",
            "emergency_contact_name", "emergency_contact_phone"
        }
        result = super().to_dict(exclude)
        result["full_name"] = self.full_name
        result["is_active_employee"] = self.is_active_employee
        result["years_of_service"] = self.years_of_service
        return result

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, employee_number={self.employee_number}, name={self.full_name})>"