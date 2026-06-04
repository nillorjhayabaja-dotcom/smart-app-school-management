# Authentication & Security — WorkforceIQ EDU

## Overview

WorkforceIQ EDU implements a comprehensive security architecture with multiple defense layers protecting against common attack vectors. The system uses JWT-based authentication with role-based access control (RBAC), Argon2 password hashing, and enterprise-grade audit logging.

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 9: Request ID Tracking        ──── Correlation & Debug   │
│  Layer 8: Audit Logging              ──── Activity Trail         │
│  Layer 7: Account Lockout (5/15)     ──── Brute Force Defense    │
│  Layer 6: Password Hashing (Argon2)  ──── Credential Protection  │
│  Layer 5: RBAC Authorization         ──── Permission Enforcement │
│  Layer 4: JWT Authentication         ──── Identity Verification  │
│  Layer 3: CORS (Origin Validation)   ──── Cross-Origin Defense   │
│  Layer 2: Security Headers (HSTS)    ──── Browser Protection     │
│  Layer 1: HTTPS/TLS (Transport)      ──── Wire Encryption        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## JWT Authentication

### Token Structure

#### Access Token (30 minutes)

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "exp": 1705312200,
  "iat": 1705310400,
  "type": "access"
}
```

#### Refresh Token (7 days)

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "exp": 1705915200,
  "iat": 1705310400,
  "type": "refresh"
}
```

### Token Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Algorithm | HS256 | HMAC-SHA256 |
| Access Expiry | 30 minutes | Short-lived for security |
| Refresh Expiry | 7 days | Long-lived for UX |
| Secret Key | 32+ chars | Environment variable |

### Authentication Flow

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │  API    │     │ Auth     │     │ Database   │
└───┬────┘     └────┬────┘     └────┬─────┘     └─────┬──────┘
    │               │               │                  │
    │ POST /login   │               │                  │
    │──────────────>│               │                  │
    │               │               │                  │
    │               │ Query user    │                  │
    │               │──────────────────────────────────>│
    │               │               │                  │
    │               │ User + roles  │                  │
    │               │<──────────────────────────────────│
    │               │               │                  │
    │               │ Verify Argon2 │                  │
    │               │ password hash │                  │
    │               │               │                  │
    │               │ Check lockout │                  │
    │               │               │                  │
    │               │ Update last_login                 │
    │               │──────────────────────────────────>│
    │               │               │                  │
    │               │ Generate JWT  │                  │
    │               │ (access +     │                  │
    │               │  refresh)     │                  │
    │               │               │                  │
    │  { tokens }   │               │                  │
    │<──────────────│               │                  │
    │               │               │                  │
    │ GET /me       │               │                  │
    │ + Bearer      │               │                  │
    │──────────────>│               │                  │
    │               │ Verify JWT    │                  │
    │               │ signature +   │                  │
    │               │ expiration    │                  │
    │               │               │                  │
    │               │ Load user     │                  │
    │               │──────────────────────────────────>│
    │               │               │                  │
    │  { user }     │               │                  │
    │<──────────────│               │                  │
```

### Password Hashing (Argon2id)

```python
from argon2 import PasswordHasher

# Hashing
ph = PasswordHasher(
    time_cost=3,        # Number of iterations
    memory_cost=65536,  # 64 MB memory usage
    parallelism=4,      # Number of parallel threads
    hash_len=32,        # Length of the hash
    salt_len=16,        # Length of random salt
)

hashed = ph.hash("Admin@123456")

# Verification
try:
    ph.verify(hashed, "Admin@123456")
    print("Password is correct")
except VerifyMismatchError:
    print("Invalid password")
```

**Why Argon2id over bcrypt:**
- Memory-hard algorithm resists GPU-based attacks
- Configurable memory cost (64 MB default)
- Parallelism support for multi-core systems
- Winner of the Password Hashing Competition (2015)

---

## Role-Based Access Control (RBAC)

### Permission Model

```
User ──N:M──> Role ──N:M──> Permission

Example:
  Admin User ──> admin role ──> users:create
                            ──> users:read
                            ──> users:update
                            ──> users:delete
                            ──> employees:*
                            ──> reports:*
                            ──> analytics:read
```

### Default Roles

| Role | Level | Description | Key Permissions |
|------|-------|-------------|-----------------|
| `admin` | 100 | Full system access | All permissions |
| `hr_manager` | 80 | HR management | employees:*, reports:read |
| `department_head` | 60 | Department access | department-level data |
| `teacher` | 40 | Basic read access | own data, public reports |
| `viewer` | 10 | Read-only | public data only |

### Permission Categories

| Category | Permissions | Description |
|----------|-------------|-------------|
| `users` | `create`, `read`, `update`, `delete` | User management |
| `employees` | `create`, `read`, `update`, `delete` | Employee management |
| `reports` | `read`, `generate` | Report access |
| `analytics` | `read` | Analytics dashboards |
| `settings` | `read`, `update` | System settings |
| `audit` | `read` | Audit log access |
| `notifications` | `create`, `read`, `update`, `delete` | Notification management |

### RBAC Middleware Implementation

```python
# require_role - Check if user has specific role(s)
@router.get("/admin", dependencies=[Depends(require_role("admin"))])
async def admin_endpoint():
    pass

# require_permission - Check if user has specific permission(s)
@router.post("/users", dependencies=[Depends(require_permission("users:create"))])
async def create_user():
    pass

# require_roles_and_permissions - Combined check
@router.get("/reports",
    dependencies=[Depends(require_roles_and_permissions(
        roles=["admin", "hr_manager"],
        permissions=["reports:read"]
    ))])
async def get_reports():
    pass
```

### Superuser Bypass

```python
# Superusers bypass all permission checks
if current_user.is_superuser:
    return True
```

---

## Account Lockout

### Configuration

| Setting | Value |
|---------|-------|
| Max Failed Attempts | 5 |
| Lockout Duration | 15 minutes |
| Counter Reset | On successful login |

### Implementation

```python
# On failed login
user.failed_login_attempts += 1

if user.failed_login_attempts >= 5:
    user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)

# On successful login
user.failed_login_attempts = 0
user.locked_until = None
```

### Lockout Check

```python
@property
def is_locked(self) -> bool:
    if self.locked_until is None:
        return False
    return datetime.now(timezone.utc) < self.locked_until
```

---

## Security Headers

### Headers Applied

```python
class SecurityHeadersMiddleware:
    headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), camera=(), microphone=()"
    }
```

### Header Descriptions

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options` | Prevents MIME type sniffing |
| `X-Frame-Options` | Prevents clickjacking (DENY) |
| `X-XSS-Protection` | Enables browser XSS filter |
| `Strict-Transport-Security` | Forces HTTPS (HSTS) |
| `Content-Security-Policy` | Restricts resource sources |
| `Referrer-Policy` | Controls referrer information |
| `Permissions-Policy` | Restricts browser features |

---

## CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # ["http://localhost:3000", "http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production CORS

```
CORS_ORIGINS=https://workforceiq-edu.rjabaja.workers.dev
```

---

## Request Tracking

### Request ID Middleware

Every request receives a unique UUID for:
- **Correlation** — Link logs across services
- **Debugging** — Trace request lifecycle
- **Monitoring** — Performance tracking

```python
class RequestIdMiddleware:
    async def __call__(self, scope, receive, send):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add to response headers
        response = await self.app(scope, receive, send)
        response.headers["X-Request-ID"] = request_id
```

---

## Audit Logging

### Tracked Events

| Event | Description |
|-------|-------------|
| `user.login` | Successful login |
| `user.login_failed` | Failed login attempt |
| `user.logout` | User logout |
| `user.created` | User account created |
| `user.updated` | User profile updated |
| `user.deleted` | User account deleted |
| `role.assigned` | Role assigned to user |
| `role.removed` | Role removed from user |
| `password.changed` | Password changed |
| `notification.created` | Notification sent |
| `notification.read` | Notification marked read |

### Audit Log Structure

```json
{
  "id": "audit-uuid",
  "user_id": "user-uuid",
  "action": "user.login",
  "resource": "users",
  "resource_id": "user-uuid",
  "details": {
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "request_id": "req-uuid"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Sensitive Data Protection

### API Response Filtering

```python
def to_dict(self, exclude: set[str] | None = None) -> dict:
    # Always exclude sensitive fields
    exclude = exclude | {"password_hash", "failed_login_attempts", "locked_until"}
    return super().to_dict(exclude)
```

### Excluded Fields by Default

| Field | Reason |
|-------|--------|
| `password_hash` | Credential protection |
| `failed_login_attempts` | Security information |
| `locked_until` | Security information |
| `salary` | Financial privacy |
| `address` | Personal privacy |
| `date_of_birth` | Personal privacy |
| `emergency_contact_*` | Personal privacy |

---

## Password Policy

### Requirements

| Rule | Requirement |
|------|-------------|
| Minimum Length | 8 characters |
| Complexity | Uppercase + lowercase + number + special character |
| History | Last 5 passwords cannot be reused |
| Expiry | 90 days (configurable) |

### Password Change Flow

```
1. User enters current password
2. Server verifies against Argon2 hash
3. Server validates new password against policy
4. Server hashes new password with Argon2
5. Server updates password_hash in database
6. Server invalidates all existing refresh tokens
7. Server logs password change in audit trail
```

---

## Environment Security

### Secrets Management

```bash
# .env file (NEVER commit to git)
JWT_SECRET_KEY=your-32-char-minimum-secret-key-here!
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/db

# Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Production Checklist

- [ ] `DEBUG=false`
- [ ] `JWT_SECRET_KEY` is 32+ characters
- [ ] `DATABASE_URL` uses SSL
- [ ] `CORS_ORIGINS` is production domain only
- [ ] `ENABLE_SECURE_HEADERS=true`
- [ ] Redis password is set
- [ ] HTTPS is enforced

---

## API Security Best Practices

### Rate Limiting

```python
# Login endpoint: 10 attempts per 15 minutes
# API endpoints: 1000 requests per hour
# Unauthenticated: 100 requests per hour
```

### Input Validation

```python
# Pydantic schemas validate all input
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
```

### SQL Injection Prevention

```python
# SQLAlchemy ORM uses parameterized queries
user = await db.execute(
    select(User).where(User.email == email)  # Parameterized
)
```

### Error Handling

```python
# Never expose internal errors to client
try:
    user = await user_repo.get_by_email(email)
except Exception:
    raise HTTPException(
        status_code=401,
        detail="Invalid email or password"  # Generic message
    )
```

---

## Multi-Tenant Security

### Tenant Isolation

```python
# All queries are scoped to organization
async def get_employees(db: AsyncSession, org_id: str):
    return await db.execute(
        select(Employee)
        .where(Employee.organization_id == org_id)  # Tenant filter
    )
```

### Tenant Context

```python
# Middleware sets tenant context from JWT
request.state.tenant_id = current_user.organization_id
```

---

## Compliance Considerations

### Data Protection

- **GDPR:** User data export and deletion capabilities
- **FERPA:** Student education records protection
- **SOC 2:** Audit logging and access controls

### Security Monitoring

- Failed login attempt tracking
- Unusual activity detection
- API usage anomaly alerts
- Database access logging

---

## Security Testing

### Automated Checks

```bash
# Bandit - Security linting for Python
bandit -r app/

# Safety - Dependency vulnerability check
safety check -r requirements/requirements.txt

# Snyk - Container scanning
snyk container test workforceiq-backend
```

### Manual Testing

- [ ] JWT token expiration works correctly
- [ ] Refresh token rotation functions
- [ ] Account lockout triggers after 5 attempts
- [ ] RBAC denies unauthorized access
- [ ] CORS blocks cross-origin requests
- [ ] Security headers are present
- [ ] Audit logs capture all events