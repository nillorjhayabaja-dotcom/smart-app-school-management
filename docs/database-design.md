# Database Design — WorkforceIQ EDU

## Overview

WorkforceIQ EDU uses **PostgreSQL 16** as its primary database with **SQLAlchemy 2.0** async ORM. The schema follows a normalized relational design with strategic denormalization for analytics performance.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │    users      │       │  user_roles   │       │    roles      │        │
│  ├──────────────┤       ├──────────────┤       ├──────────────┤        │
│  │ id (UUID) PK │──1:N──│ user_id  FK  │──N:1──│ id (UUID) PK │        │
│  │ email        │       │ role_id  FK  │──N:1──│ name         │        │
│  │ password_hash│       │ assigned_by  │       │ description  │        │
│  │ first_name   │       │ assigned_at  │       │ is_system    │        │
│  │ last_name    │       │ notes        │       │ level        │        │
│  │ phone        │       └──────────────┘       └──────┬───────┘        │
│  │ avatar_url   │                                      │                │
│  │ last_login   │       ┌──────────────┐       ┌──────┴───────┐        │
│  │ is_verified  │       │role_perms    │       │ permissions  │        │
│  │ is_superuser │       ├──────────────┤       ├──────────────┤        │
│  │ failed_login │       │ role_id  FK  │──N:1──│ id (UUID) PK │        │
│  │ locked_until │       │ perm_id  FK  │──N:1──│ name         │        │
│  │ created_at   │       └──────────────┘       │ description  │        │
│  │ updated_at   │                              │ category     │        │
│  └──────┬───────┘                              └──────────────┘        │
│         │                                                               │
│         │ 1:1                                                           │
│         │                                                               │
│  ┌──────┴───────┐       ┌──────────────┐                               │
│  │  employees    │       │ departments  │                               │
│  ├──────────────┤       ├──────────────┤                               │
│  │ id (UUID) PK │       │ id (UUID) PK │                               │
│  │ user_id  FK  │──N:1──│ head_id  FK  │                               │
│  │ emp_number   │       │ parent_id FK │──self-ref──│                   │
│  │ first_name   │       │ name         │                                │
│  │ last_name    │       │ code         │                                │
│  │ email        │       │ description  │                                │
│  │ dept_id  FK  │──N:1──│ budget       │                                │
│  │ position     │       │ location     │                                │
│  │ emp_type     │       └──────────────┘                               │
│  │ hire_date    │                                                       │
│  │ salary       │       ┌──────────────────┐                           │
│  │ status       │       │ notifications    │                           │
│  │ workload     │       ├──────────────────┤                           │
│  │ performance  │       │ id (UUID) PK     │                           │
│  │ retention_risk│      │ user_id  FK      │──N:1──users               │
│  └──────────────┘       │ title            │                           │
│                         │ message          │                           │
│  ┌──────────────────┐   │ category         │                           │
│  │notif_preferences │   │ priority         │                           │
│  ├──────────────────┤   │ is_read          │                           │
│  │ id (UUID) PK     │   │ metadata_json    │                           │
│  │ user_id  FK      │──N:1──users         │                           │
│  │ category         │   └──────────────────┘                           │
│  │ in_app_enabled   │                                                   │
│  │ email_enabled    │   ┌──────────────────────┐                       │
│  │ push_enabled     │   │notif_delivery_logs   │                       │
│  │ sms_enabled      │   ├──────────────────────┤                       │
│  └──────────────────┘   │ id (UUID) PK         │                       │
│                         │ notification_id FK   │──N:1──notifications   │
│                         │ channel              │                       │
│                         │ status               │                       │
│                         │ attempts             │                       │
│                         └──────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### 1. Users Table

The `users` table stores authentication credentials and profile information.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    last_login      TIMESTAMPTZ,
    is_verified     BOOLEAN DEFAULT FALSE NOT NULL,
    is_superuser    BOOLEAN DEFAULT FALSE NOT NULL,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until    TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT TRUE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_is_active ON users(is_active);
```

**Design Decisions:**
- `password_hash` is nullable to support SSO/OAuth users
- `failed_login_attempts` + `locked_until` implement account lockout
- Sensitive fields excluded from API responses via `to_dict(exclude={...})`

---

### 2. Employees Table

The `employees` table stores employment-related information for all staff members.

```sql
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    position        VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time' NOT NULL,
    hire_date       DATE DEFAULT CURRENT_DATE NOT NULL,
    termination_date DATE,
    salary          NUMERIC(12,2),
    status          VARCHAR(20) DEFAULT 'active' NOT NULL,
    address         TEXT,
    date_of_birth   DATE,
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    workload        INTEGER DEFAULT 0 NOT NULL,
    performance     INTEGER DEFAULT 0 NOT NULL,
    retention_risk  VARCHAR(10) DEFAULT 'low' NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX ix_employees_employee_number ON employees(employee_number);
CREATE INDEX ix_employees_user_id ON employees(user_id);
CREATE INDEX ix_employees_email ON employees(email);
CREATE INDEX ix_employees_department_id ON employees(department_id);
CREATE INDEX ix_employees_status ON employees(status);
```

**Design Decisions:**
- `user_id` is nullable (1:1 optional) — not all employees have system access
- `workload`, `performance`, `retention_risk` are denormalized for ML analytics
- `salary` excluded from API responses by default

---

### 3. Departments Table

```sql
CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    head_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
    parent_id   UUID REFERENCES departments(id) ON DELETE CASCADE,
    budget      FLOAT,
    location    VARCHAR(100),
    is_active   BOOLEAN DEFAULT TRUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_departments_code ON departments(code);
CREATE INDEX ix_departments_parent_id ON departments(parent_id);
```

**Design Decisions:**
- Self-referential `parent_id` enables hierarchical department structure
- `head_id` references employee (not user) since department heads are staff

---

### 4. Roles & Permissions Tables

```sql
-- Roles
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_system   BOOLEAN DEFAULT FALSE NOT NULL,
    level       INTEGER DEFAULT 0 NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Permissions
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category    VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Role-Permission Association
CREATE TABLE role_permissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- User-Role Association
CREATE TABLE user_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    notes       VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, role_id)
);

CREATE INDEX ix_user_roles_user_id ON user_roles(user_id);
CREATE INDEX ix_user_roles_role_id ON user_roles(role_id);
```

**Design Decisions:**
- `level` on roles enables hierarchy-based access checks
- `is_system` prevents deletion of built-in roles
- `assigned_by` provides audit trail for role assignments

---

### 5. Notification Tables

```sql
-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    category        VARCHAR(20) NOT NULL,
    priority        VARCHAR(10) DEFAULT 'MEDIUM' NOT NULL,
    action_url      VARCHAR(500),
    metadata_json   JSONB,
    target_role     VARCHAR(50),
    target_department VARCHAR(100),
    is_read         BOOLEAN DEFAULT FALSE NOT NULL,
    read_at         TIMESTAMPTZ,
    is_archived     BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX ix_notifications_category_priority ON notifications(category, priority);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        VARCHAR(20) NOT NULL,
    in_app_enabled  BOOLEAN DEFAULT TRUE NOT NULL,
    email_enabled   BOOLEAN DEFAULT TRUE NOT NULL,
    push_enabled    BOOLEAN DEFAULT TRUE NOT NULL,
    sms_enabled     BOOLEAN DEFAULT FALSE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, category)
);

-- Notification Delivery Logs
CREATE TABLE notification_delivery_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel         VARCHAR(10) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' NOT NULL,
    attempts        INTEGER DEFAULT 0 NOT NULL,
    last_attempt_at TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Design Decisions:**
- `metadata_json` (JSONB) stores flexible notification data
- Composite index on `(user_id, is_read)` for efficient unread count queries
- Soft delete via `deleted_at` preserves notification history

---

## Table Relationships

| Relationship | Type | FK Constraint | Cascade |
|-------------|------|---------------|---------|
| Users → UserRoles | 1:N | `user_roles.user_id → users.id` | CASCADE |
| Roles → UserRoles | 1:N | `user_roles.role_id → roles.id` | CASCADE |
| Roles → RolePermissions | 1:N | `role_permissions.role_id → roles.id` | CASCADE |
| Permissions → RolePermissions | 1:N | `role_permissions.permission_id → permissions.id` | CASCADE |
| Users → Employees | 1:1 | `employees.user_id → users.id` | SET NULL |
| Departments → Employees | 1:N | `employees.department_id → departments.id` | SET NULL |
| Employees → Departments (head) | 1:1 | `departments.head_id → employees.id` | SET NULL |
| Departments → Departments (parent) | Self-ref | `departments.parent_id → departments.id` | CASCADE |
| Users → Notifications | 1:N | `notifications.user_id → users.id` | CASCADE |
| Users → NotificationPreferences | 1:N | `notification_preferences.user_id → users.id` | CASCADE |
| Notifications → DeliveryLogs | 1:N | `notification_delivery_logs.notification_id → notifications.id` | CASCADE |

---

## Indexing Strategy

### Performance-Critical Indexes

```sql
-- Authentication (high frequency)
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_is_active ON users(is_active);

-- RBAC checks (every authenticated request)
CREATE INDEX ix_user_roles_user_id ON user_roles(user_id);
CREATE INDEX ix_user_roles_role_id ON user_roles(role_id);

-- Employee queries (dashboard, analytics)
CREATE INDEX ix_employees_department_id ON employees(department_id);
CREATE INDEX ix_employees_status ON employees(status);
CREATE INDEX ix_employees_employee_number ON employees(employee_number);

-- Notifications (real-time, high frequency)
CREATE INDEX ix_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX ix_notifications_category_priority ON notifications(category, priority);

-- Department hierarchy
CREATE INDEX ix_departments_parent_id ON departments(parent_id);
```

### Composite Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `ix_notifications_user_unread` | `(user_id, is_read)` | Fast unread count |
| `ix_notifications_category_priority` | `(category, priority)` | Filtered notifications |
| `ix_user_roles_unique` | `(user_id, role_id)` | Unique constraint |

---

## Data Types

### UUID Primary Keys

All tables use UUID primary keys for:
- **Distributed systems** — No sequential ID conflicts
- **Security** — Non-guessable identifiers
- **Merging** — Safe to merge datasets from different instances

### JSONB Columns

Used in `notifications.metadata_json` for:
- Flexible notification data (variable structure per category)
- Efficient querying with GIN indexes (if needed)
- Schema evolution without migrations

### Timestamps

All tables include:
- `created_at` — Record creation timestamp (server default)
- `updated_at` — Last modification timestamp (auto-updated)

---

## Connection Pooling

### Configuration

```python
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,        # Verify connections before use
    future=True,               # SQLAlchemy 2.0 behavior
    pool_size=20,              # Base connection count
    max_overflow=40,           # Burst capacity
    pool_timeout=30,           # Seconds to wait for connection
)
```

### Pool Strategy

```
Normal Load: 20 connections (pool_size)
Peak Load:   Up to 60 connections (pool_size + max_overflow)
Idle:        Connections released after pool_timeout
Health:      Pre-ping validates before use
```

---

## Migration Strategy

### Alembic Migrations

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "add notifications table"

# Apply pending migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history
```

### Migration Naming Convention

```
2024_01_15_103000_add_notifications_table.py
YYYY_MM_DD_HHMMSS_description.py
```

---

## Seed Data

### Default Roles

| Role | Level | Description |
|------|-------|-------------|
| `admin` | 100 | Full system access |
| `hr_manager` | 80 | Employee management |
| `department_head` | 60 | Department access |
| `teacher` | 40 | Basic read access |
| `viewer` | 10 | Read-only |

### Default Permissions

| Category | Permissions |
|----------|-------------|
| `users` | `create`, `read`, `update`, `delete` |
| `employees` | `create`, `read`, `update`, `delete` |
| `reports` | `read`, `generate` |
| `analytics` | `read` |
| `settings` | `read`, `update` |
| `audit` | `read` |

### Admin User

```python
{
    "email": "admin@school.edu",
    "password": "Admin@123456",  # Argon2 hashed
    "first_name": "Admin",
    "last_name": "User",
    "is_superuser": True,
    "roles": ["admin"]
}
```

---

## Backup Strategy

### Automated Backups

```bash
# Daily backup via pg_dump
pg_dump -U postgres school_management | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20240115.sql.gz | psql -U postgres school_management
```

### Point-in-Time Recovery

PostgreSQL WAL archabling enables point-in-time recovery for disaster scenarios.

---

## Performance Considerations

### Query Optimization

1. **Eager Loading** — `selectin` strategy for related entities (roles, department)
2. **Lazy Loading** — Default for rarely-accessed relationships
3. **Connection Pooling** — Pre-validated connections with health checks
4. **Strategic Indexing** — Composite indexes for hot query paths

### Analytics Queries

```sql
-- Dashboard enrollment summary (optimized)
SELECT 
    department_id,
    COUNT(*) as employee_count,
    AVG(workload) as avg_workload,
    AVG(performance) as avg_performance
FROM employees
WHERE status = 'active'
GROUP BY department_id;
```

### Expected Query Performance

| Query Type | Target Latency |
|-----------|----------------|
| Authentication | < 50ms |
| Single record lookup | < 10ms |
| Paginated list (50 items) | < 100ms |
| Dashboard aggregate | < 200ms |
| ML prediction input | < 500ms |