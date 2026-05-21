"""
Department model for organizational structure.

Departments represent organizational units within the school
(e.g., Mathematics, Science, English, Administration).
"""

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.employee import Employee


class Department(Base):
    """
    Department model representing organizational units.
    
    Departments are used to organize employees and can have a hierarchical
    structure with parent/child relationships.
    
    Attributes:
        name: Department name (e.g., "Mathematics", "Administration")
        code: Unique department code (e.g., "MATH", "ADMIN")
        description: Detailed description of the department
        head_id: Optional reference to the department head (employee)
        parent_id: Optional parent department for hierarchy
        budget: Optional annual budget allocation
        location: Optional physical location/building
    """

    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    head_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
    )
    parent_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    budget: Mapped[Optional[float]] = mapped_column(
        nullable=True,
    )
    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    # Relationships
    head: Mapped[Optional["Employee"]] = relationship(
        back_populates="headed_department",
        foreign_keys=[head_id],
    )
    parent: Mapped[Optional["Department"]] = relationship(
        back_populates="children",
        remote_side="Department.id",
        foreign_keys=[parent_id],
    )
    children: Mapped[List["Department"]] = relationship(
        back_populates="parent",
        foreign_keys=[parent_id],
    )
    employees: Mapped[List["Employee"]] = relationship(
        back_populates="department",
        foreign_keys="[Employee.department_id]",
        lazy="selectin",
    )

    @property
    def employee_count(self) -> int:
        """Return the number of employees in this department."""
        return len(self.employees)

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, code={self.code}, name={self.name})>"