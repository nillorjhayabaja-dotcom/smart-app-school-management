"""
Database seeder for initial data population.

Provides functions to:
- Create system roles and permissions
- Create default admin user
- Create sample departments and employees
- Seed test data for development
"""

import logging
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.password_handler import PasswordHandler
from app.models.department import Department
from app.models.employee import Employee
from app.models.role import Permission, Role, RolePermission
from app.models.user import User
from app.models.user_role import UserRole

logger = logging.getLogger(__name__)


# Define system permissions
SYSTEM_PERMISSIONS = [
    # User management
    {"name": "users:create", "description": "Create new users", "category": "users"},
    {"name": "users:read", "description": "View user details", "category": "users"},
    {"name": "users:update", "description": "Update user information", "category": "users"},
    {"name": "users:delete", "description": "Delete users", "category": "users"},
    # Employee management
    {"name": "employees:create", "description": "Create new employees", "category": "employees"},
    {"name": "employees:read", "description": "View employee details", "category": "employees"},
    {"name": "employees:update", "description": "Update employee information", "category": "employees"},
    {"name": "employees:delete", "description": "Delete employees", "category": "employees"},
    # Reports
    {"name": "reports:read", "description": "View reports", "category": "reports"},
    {"name": "reports:create", "description": "Generate reports", "category": "reports"},
    {"name": "reports:export", "description": "Export reports", "category": "reports"},
    # Analytics
    {"name": "analytics:read", "description": "View analytics", "category": "analytics"},
    {"name": "analytics:manage", "description": "Manage analytics settings", "category": "analytics"},
    # Settings
    {"name": "settings:read", "description": "View settings", "category": "settings"},
    {"name": "settings:update", "description": "Update settings", "category": "settings"},
    # Audit logs
    {"name": "audit:read", "description": "View audit logs", "category": "audit"},
]

# Define system roles
SYSTEM_ROLES = [
    {
        "name": "admin",
        "description": "System administrator with full access",
        "is_system": True,
        "level": 100,
        "permissions": [p["name"] for p in SYSTEM_PERMISSIONS],
    },
    {
        "name": "hr_manager",
        "description": "HR manager with employee management access",
        "is_system": True,
        "level": 80,
        "permissions": [
            "employees:create", "employees:read", "employees:update",
            "reports:read", "reports:create", "reports:export",
            "analytics:read",
            "users:read",
        ],
    },
    {
        "name": "department_head",
        "description": "Department head with limited management access",
        "is_system": True,
        "level": 60,
        "permissions": [
            "employees:read",
            "reports:read",
            "analytics:read",
        ],
    },
    {
        "name": "teacher",
        "description": "Teacher with basic access",
        "is_system": True,
        "level": 40,
        "permissions": [
            "employees:read",
            "reports:read",
        ],
    },
    {
        "name": "viewer",
        "description": "Read-only access to public data",
        "is_system": True,
        "level": 10,
        "permissions": [
            "reports:read",
        ],
    },
]

# Default admin user credentials
DEFAULT_ADMIN = {
    "email": "admin@school.edu",
    "password": "Admin@123456",
    "first_name": "System",
    "last_name": "Administrator",
}

# Sample departments
SAMPLE_DEPARTMENTS = [
    {"code": "ADMIN", "name": "Administration", "description": "School administration"},
    {"code": "MATH", "name": "Mathematics", "description": "Mathematics department"},
    {"code": "SCI", "name": "Science", "description": "Science department"},
    {"code": "ENG", "name": "English", "description": "English department"},
    {"code": "HIST", "name": "History", "description": "History department"},
    {"code": "ART", "name": "Arts", "description": "Arts department"},
    {"code": "PE", "name": "Physical Education", "description": "Physical Education department"},
    {"code": "MUSIC", "name": "Music", "description": "Music department"},
]

# Sample employees
SAMPLE_EMPLOYEES = [
    {
        "employee_number": "EMP-001",
        "first_name": "Alice",
        "last_name": "Johnson",
        "email": "alice.johnson@school.edu",
        "department_code": "MATH",
        "position": "Mathematics Teacher",
        "employment_type": "full_time",
        "hire_date": date(2020, 8, 15),
        "status": "active",
        "workload": 95,
        "performance": 78,
        "retention_risk": "high",
    },
    {
        "employee_number": "EMP-002",
        "first_name": "Brian",
        "last_name": "Lee",
        "email": "brian.lee@school.edu",
        "department_code": "SCI",
        "position": "Science Teacher",
        "employment_type": "full_time",
        "hire_date": date(2019, 3, 1),
        "status": "active",
        "workload": 72,
        "performance": 84,
        "retention_risk": "medium",
    },
    {
        "employee_number": "EMP-003",
        "first_name": "Chloe",
        "last_name": "Kim",
        "email": "chloe.kim@school.edu",
        "department_code": "ENG",
        "position": "English Teacher",
        "employment_type": "full_time",
        "hire_date": date(2021, 1, 10),
        "status": "active",
        "workload": 48,
        "performance": 70,
        "retention_risk": "low",
    },
    {
        "employee_number": "EMP-004",
        "first_name": "David",
        "last_name": "Martinez",
        "email": "david.martinez@school.edu",
        "department_code": "ADMIN",
        "position": "HR Manager",
        "employment_type": "full_time",
        "hire_date": date(2018, 6, 1),
        "status": "active",
        "workload": 85,
        "performance": 92,
        "retention_risk": "low",
    },
    {
        "employee_number": "EMP-005",
        "first_name": "Eva",
        "last_name": "Chen",
        "email": "eva.chen@school.edu",
        "department_code": "MATH",
        "position": "Mathematics Department Head",
        "employment_type": "full_time",
        "hire_date": date(2015, 9, 1),
        "status": "active",
        "workload": 90,
        "performance": 88,
        "retention_risk": "low",
    },
    {
        "employee_number": "EMP-006",
        "first_name": "Frank",
        "last_name": "Wilson",
        "email": "frank.wilson@school.edu",
        "department_code": "ART",
        "position": "Art Teacher",
        "employment_type": "part_time",
        "hire_date": date(2022, 2, 15),
        "status": "active",
        "workload": 40,
        "performance": 75,
        "retention_risk": "medium",
    },
]


async def seed_permissions(db: AsyncSession) -> dict:
    """
    Seed system permissions.
    
    Returns:
        Dictionary mapping permission names to permission instances
    """
    permissions = {}
    
    for perm_data in SYSTEM_PERMISSIONS:
        # Check if permission already exists
        existing = await db.get(Permission, {"name": perm_data["name"]})
        if existing is None:
            perm = Permission(**perm_data)
            db.add(perm)
            permissions[perm_data["name"]] = perm
            logger.info(f"Created permission: {perm_data['name']}")
        else:
            permissions[perm_data["name"]] = existing
    
    await db.flush()
    return permissions


async def seed_roles(db: AsyncSession, permissions: dict) -> dict:
    """
    Seed system roles with permissions.
    
    Args:
        db: Database session
        permissions: Dictionary of permission instances
        
    Returns:
        Dictionary mapping role names to role instances
    """
    roles = {}
    
    for role_data in SYSTEM_ROLES:
        # Check if role already exists
        existing = await db.get(Role, {"name": role_data["name"]})
        if existing is None:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                is_system=role_data["is_system"],
                level=role_data["level"],
            )
            db.add(role)
            roles[role_data["name"]] = role
            
            # Add permissions to role
            for perm_name in role_data["permissions"]:
                if perm_name in permissions:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=permissions[perm_name].id,
                    )
                    db.add(role_perm)
            
            logger.info(f"Created role: {role_data['name']}")
        else:
            roles[role_data["name"]] = existing
    
    await db.flush()
    return roles


async def seed_admin_user(
    db: AsyncSession,
    roles: dict,
    employee: Employee = None,
) -> User:
    """
    Seed default admin user.
    
    Args:
        db: Database session
        roles: Dictionary of role instances
        employee: Optional employee to link to user
        
    Returns:
        Admin user instance
    """
    # Check if admin user already exists
    admin = await db.get(User, {"email": DEFAULT_ADMIN["email"]})
    
    if admin is None:
        admin = User(
            email=DEFAULT_ADMIN["email"],
            password_hash=PasswordHandler.hash_password(DEFAULT_ADMIN["password"]),
            first_name=DEFAULT_ADMIN["first_name"],
            last_name=DEFAULT_ADMIN["last_name"],
            is_superuser=True,
            is_verified=True,
            is_active=True,
        )
        db.add(admin)
        await db.flush()
        
        # Assign admin role
        admin_role = roles.get("admin")
        if admin_role:
            user_role = UserRole(
                user_id=admin.id,
                role_id=admin_role.id,
                notes="Default admin user created during seeding",
            )
            db.add(user_role)
        
        logger.info(f"Created admin user: {DEFAULT_ADMIN['email']}")
    else:
        # Update existing admin if needed
        if not admin.is_superuser:
            admin.is_superuser = True
            await db.flush()
    
    return admin


async def seed_departments(db: AsyncSession) -> dict:
    """
    Seed sample departments.
    
    Returns:
        Dictionary mapping department codes to department instances
    """
    departments = {}
    
    for dept_data in SAMPLE_DEPARTMENTS:
        existing = await db.get(Department, {"code": dept_data["code"]})
        if existing is None:
            dept = Department(**dept_data)
            db.add(dept)
            departments[dept_data["code"]] = dept
            logger.info(f"Created department: {dept_data['code']}")
        else:
            departments[dept_data["code"]] = existing
    
    await db.flush()
    return departments


async def seed_employees(db: AsyncSession, departments: dict) -> List[Employee]:
    """
    Seed sample employees.
    
    Args:
        db: Database session
        departments: Dictionary of department instances
        
    Returns:
        List of created employee instances
    """
    employees = []
    
    for emp_data in SAMPLE_EMPLOYEES:
        existing = await db.get(Employee, {"employee_number": emp_data["employee_number"]})
        if existing is None:
            dept = departments.get(emp_data["department_code"])
            emp = Employee(
                **{k: v for k, v in emp_data.items() if k != "department_code"},
                department_id=dept.id if dept else None,
            )
            db.add(emp)
            employees.append(emp)
            logger.info(f"Created employee: {emp_data['employee_number']}")
        else:
            employees.append(existing)
    
    await db.flush()
    return employees


async def seed_all(db: AsyncSession) -> None:
    """
    Run all seeders to populate the database with initial data.
    
    This function:
    1. Creates system permissions
    2. Creates system roles with permissions
    3. Creates default admin user
    4. Creates sample departments
    5. Creates sample employees
    
    Args:
        db: Database session
    """
    logger.info("Starting database seeding...")
    
    # Seed permissions
    permissions = await seed_permissions(db)
    logger.info(f"Seeded {len(permissions)} permissions")
    
    # Seed roles
    roles = await seed_roles(db, permissions)
    logger.info(f"Seeded {len(roles)} roles")
    
    # Seed departments
    departments = await seed_departments(db)
    logger.info(f"Seeded {len(departments)} departments")
    
    # Seed employees
    employees = await seed_employees(db, departments)
    logger.info(f"Seeded {len(employees)} employees")
    
    # Seed admin user (link to HR manager employee if exists)
    hr_employee = next((e for e in employees if e.email == "david.martinez@school.edu"), None)
    admin = await seed_admin_user(db, roles, hr_employee)
    logger.info(f"Seeded admin user: {admin.email}")
    
    await db.commit()
    logger.info("Database seeding completed successfully!")


async def get_default_admin_credentials() -> dict:
    """
    Get default admin credentials for testing.
    
    Returns:
        Dictionary with email and password
    """
    return DEFAULT_ADMIN.copy()