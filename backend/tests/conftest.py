"""
Pytest configuration and fixtures for API integration tests.

Provides:
- Test database setup and teardown
- Test client with async support
- Authentication fixtures
- Database seeding for tests
"""

import asyncio
from typing import AsyncGenerator, Generator
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.db import close_db, init_db
from app.core.password_handler import PasswordHandler
from app.core.settings import settings
from app.main import app
from app.models.base import Base
from app.models.user import User
from app.models.role import Role, Permission, RolePermission
from app.models.user_role import UserRole


# Test database URL (using SQLite for fast tests, can be overridden)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_factory = async_sessionmaker(
        test_engine,
        expire_on_commit=False,
        class_=AsyncSession,
    )
    
    async with async_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(test_engine) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        password_hash=PasswordHandler.hash_password("TestPassword123"),
        first_name="Test",
        last_name="User",
        is_verified=True,
        is_active=True,
    )
    test_db.add(user)
    await test_db.flush()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_admin_user(test_db: AsyncSession) -> User:
    """Create a test admin user."""
    user = User(
        email="admin@example.com",
        password_hash=PasswordHandler.hash_password("AdminPassword123"),
        first_name="Admin",
        last_name="User",
        is_superuser=True,
        is_verified=True,
        is_active=True,
    )
    test_db.add(user)
    await test_db.flush()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_role(test_db: AsyncSession) -> Role:
    """Create a test role."""
    role = Role(
        name="test_role",
        description="Test role for testing",
        is_system=False,
        level=50,
    )
    test_db.add(role)
    await test_db.flush()
    await test_db.refresh(role)
    return role


@pytest_asyncio.fixture
async def test_permission(test_db: AsyncSession) -> Permission:
    """Create a test permission."""
    permission = Permission(
        name="test:read",
        description="Test read permission",
        category="test",
    )
    test_db.add(permission)
    await test_db.flush()
    await test_db.refresh(permission)
    return permission


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Get authentication headers for test user."""
    from app.core.jwt_handler import create_access_token
    
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(test_admin_user: User) -> dict:
    """Get authentication headers for admin user."""
    from app.core.jwt_handler import create_access_token
    
    token = create_access_token({"sub": str(test_admin_user.id)})
    return {"Authorization": f"Bearer {token}"}