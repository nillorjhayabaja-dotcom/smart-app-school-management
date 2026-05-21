# School Management System Backend (FastAPI)

Production-ready backend API with Clean Architecture, SQLAlchemy (async), JWT authentication, RBAC, and comprehensive error handling.

## Features

- **Authentication**: JWT-based with access/refresh tokens
- **Authorization**: Role-Based Access Control (RBAC) with permissions
- **Database**: PostgreSQL with async SQLAlchemy ORM
- **Password Security**: Argon2 hashing
- **Error Handling**: Custom exceptions with structured responses
- **Logging**: Structured JSON logging for production
- **Testing**: Comprehensive pytest integration tests
- **Docker**: Full containerization with docker-compose

## Quick Start (Docker)

```bash
# Start all services (PostgreSQL, Redis, API, Worker)
docker compose up --build

# API available at: http://localhost:8000/api/v1
# Health check: http://localhost:8000/health
```

## Local Development (No Docker)

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 16+
- Redis 7+ (optional, for caching/tasks)

### 2. Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/Scripts/activate  # Windows
# source .venv/bin/activate    # Linux/Mac

# Install dependencies
pip install -r requirements/requirements.txt
pip install -r requirements/requirements-dev.txt

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
# Default: postgresql+asyncpg://postgres:postgres@localhost:5432/school_management
```

### 3. Run

```bash
# Start the development server
uvicorn app.main:app --reload --port 8000

# API available at: http://localhost:8000
# Interactive docs: http://localhost:8000/docs (Swagger UI)
# Alternative docs: http://localhost:8000/redoc (ReDoc)
```

### 4. Initialize Database

The database tables are automatically created on startup in development mode. To seed initial data:

```python
# Run this in Python
import asyncio
from app.core.db import async_session_factory
from app.core.seeder import seed_all

async def seed():
    async with async_session_factory() as session:
        await seed_all(session)

asyncio.run(seed())
```

Default admin credentials:
- Email: `admin@school.edu`
- Password: `Admin@123456`

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth_api.py -v

# Run with detailed output
pytest -vv --tb=short
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/login` | Login and get tokens | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout | Yes |
| GET | `/api/v1/auth/me` | Get current user | Yes |
| PUT | `/api/v1/auth/password` | Change password | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users` | List users (paginated) | Yes |
| POST | `/api/v1/users` | Create user | Yes |
| GET | `/api/v1/users/{id}` | Get user by ID | Yes |
| PUT | `/api/v1/users/{id}` | Update user | Yes |
| DELETE | `/api/v1/users/{id}` | Delete user | Yes |
| GET | `/api/v1/users/{id}/roles` | Get user roles | Yes |
| POST | `/api/v1/users/{id}/roles` | Assign roles | Yes |
| DELETE | `/api/v1/users/{id}/roles/{role_id}` | Remove role | Yes |

### Employees

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/employees` | List employees | Yes |
| GET | `/api/v1/employees/{id}` | Get employee | Yes |

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── users.py         # User management endpoints
│   │   │   ├── employees.py     # Employee endpoints
│   │   │   └── ...              # Other feature endpoints
│   │   └── router.py            # API router configuration
│   ├── core/
│   │   ├── settings.py          # Application settings
│   │   ├── db.py                # Database configuration
│   │   ├── jwt_handler.py       # JWT token handling
│   │   ├── password_handler.py  # Password hashing
│   │   ├── exceptions.py        # Custom exceptions
│   │   ├── logging.py           # Logging configuration
│   │   ├── seeder.py            # Database seeding
│   │   └── celery_app.py        # Celery configuration
│   ├── models/
│   │   ├── base.py              # Base model with common fields
│   │   ├── user.py              # User model
│   │   ├── role.py              # Role & Permission models
│   │   ├── employee.py          # Employee model
│   │   ├── department.py        # Department model
│   │   └── user_role.py         # User-Role association
│   ├── repositories/
│   │   ├── base.py              # Generic repository
│   │   ├── user.py              # User repository
│   │   ├── role.py              # Role repository
│   │   └── ...                  # Other repositories
│   ├── schemas/
│   │   ├── auth.py              # Auth request/response schemas
│   │   └── user.py              # User schemas
│   ├── middleware/
│   │   ├── auth.py              # JWT authentication
│   │   ├── rbac.py              # Role-based access control
│   │   ├── request_id.py        # Request tracking
│   │   └── security_headers.py  # Security headers
│   └── main.py                  # Application entry point
├── tests/
│   ├── conftest.py              # Pytest fixtures
│   ├── test_auth_api.py         # Auth endpoint tests
│   └── test_user_api.py         # User endpoint tests
├── requirements/
│   ├── requirements.txt         # Production dependencies
│   └── requirements-dev.txt     # Development dependencies
├── docker-compose.yml           # Docker services
├── Dockerfile                   # Application container
└── .env.example                 # Environment template
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
APP_NAME=School Management System Backend
ENVIRONMENT=local
DEBUG=true
API_PREFIX=/api/v1

# Database (must use asyncpg driver)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/school_management

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Celery (optional)
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Security
ENABLE_SECURE_HEADERS=true

# Logging
LOG_LEVEL=20  # 10=DEBUG, 20=INFO, 30=WARNING, 40=ERROR
```

## Roles and Permissions

### Default Roles

| Role | Level | Description |
|------|-------|-------------|
| admin | 100 | Full system access |
| hr_manager | 80 | Employee management access |
| department_head | 60 | Limited department access |
| teacher | 40 | Basic read access |
| viewer | 10 | Read-only public access |

### Permission Categories

- `users:*` - User management
- `employees:*` - Employee management
- `reports:*` - Report generation
- `analytics:*` - Analytics access
- `settings:*` - System settings
- `audit:*` - Audit logs

## Security Features

- **Password Hashing**: Argon2id algorithm
- **JWT Tokens**: Signed with HS256
- **Account Lockout**: After 5 failed login attempts (15 min lock)
- **CORS**: Configurable allowed origins
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Request Tracking**: Unique request IDs for debugging

## Error Handling

All errors return consistent JSON responses:

```json
{
  "error": true,
  "message": "Error message",
  "error_code": "ERROR_CODE",
  "detail": "Additional details",
  "path": "/api/path"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `CONFLICT` | 409 | Resource conflict |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `DATABASE_ERROR` | 500 | Database error |

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `pytest`
5. Submit a pull request

## License

Proprietary - All rights reserved.