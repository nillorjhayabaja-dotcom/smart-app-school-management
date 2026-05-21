# Installation Guide

## Quick Install (Recommended)

```bash
# From the backend directory
pip install -r requirements/requirements.txt
pip install -r requirements/requirements-dev.txt
```

## Troubleshooting

### Pylance/VSCode Import Errors

If you see errors like "Import 'httpx' could not be resolved" in VSCode:

1. **Ensure you're using the correct Python environment:**
   - Open Command Palette (Ctrl+Shift+P)
   - Select "Python: Select Interpreter"
   - Choose the interpreter where you installed the packages

2. **Reload VSCode window:**
   - Open Command Palette (Ctrl+Shift+P)
   - Select "Developer: Reload Window"

3. **Verify installation:**
   ```bash
   pip list | grep httpx
   ```

### Database Connection Issues

If you get database connection errors:

1. **Ensure PostgreSQL is running:**
   ```bash
   # Check if PostgreSQL service is running
   # Windows: Check Services
   # Linux: sudo systemctl status postgresql
   ```

2. **Verify database exists:**
   ```bash
   psql -U postgres -c "CREATE DATABASE school_management;"
   ```

3. **Check connection string in .env:**
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/school_management
   ```

### Type Checking Errors

If you see Pylance type errors:

1. **Install development dependencies:**
   ```bash
   pip install -r requirements/requirements-dev.txt
   ```

2. **Restart language server:**
   - Open Command Palette (Ctrl+Shift+P)
   - Select "Python: Restart Language Server"

## Running the Application

### With Docker (Recommended)

```bash
docker compose up --build
```

### Without Docker

1. **Start PostgreSQL and Redis**

2. **Install dependencies:**
   ```bash
   pip install -r requirements/requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run the application:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Seed the database (optional):**
   ```python
   import asyncio
   from app.core.db import async_session_factory
   from app.core.seeder import seed_all

   async def seed():
       async with async_session_factory() as session:
           await seed_all(session)

   asyncio.run(seed())
   ```

## Running Tests

```bash
# Install test dependencies
pip install -r requirements/requirements-dev.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth_api.py -v
```

## Default Credentials

After seeding the database:
- **Email:** admin@school.edu
- **Password:** Admin@123456

## Need Help?

- Check the main [README.md](README.md)
- Review the [API Documentation](http://localhost:8000/docs) after starting the app
- Open an issue on GitHub