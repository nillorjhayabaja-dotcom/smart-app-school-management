from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import settings

# Import all models to register them with the Base metadata
from app.models.base import Base
from app.models.user import User
from app.models.role import Role, Permission, RolePermission
from app.models.department import Department
from app.models.employee import Employee
from app.models.user_role import UserRole

engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
)

async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that yields a database session.
    
    Usage:
        async for session in get_db_session():
            # use session
    """
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    """
    Initialize database tables.
    
    This creates all tables defined in the models if they don't exist.
    For production, use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()

