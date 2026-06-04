# System Architecture — WorkforceIQ EDU

## Overview

WorkforceIQ EDU follows a **layered architecture** pattern with clear separation of concerns across four primary layers: Client, API, Service, and Data. The system is designed for async-first operations, horizontal scalability, and enterprise-grade security.

---

## Architecture Principles

1. **Separation of Concerns** — Each layer has distinct responsibilities with no cross-layer coupling
2. **Async-First** — All I/O operations (database, ML inference, external calls) are asynchronous
3. **Defense in Depth** — Multiple security layers protect against different attack vectors
4. **Convention Over Configuration** — Consistent patterns reduce cognitive load
5. **Fail-Safe Defaults** — System defaults to secure, restrictive behavior

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              React 19 + TanStack Router                       │  │
│  │              Deployed on Cloudflare Workers                    │  │
│  │                                                               │  │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │  Dashboard  │ │  Analytics │ │ Reports  │ │  Notifs    │  │  │
│  │  │  (KPIs,    │ │  (Charts,  │ │ (10+     │ │ (WebSocket │  │  │
│  │  │  Charts)   │ │  Trends)   │ │ Modules) │ │  Realtime) │  │  │
│  │  └────────────┘ └────────────┘ └──────────┘ └────────────┘  │  │
│  │                                                               │  │
│  │  State: TanStack Query (server cache) + React Context         │  │
│  │  Forms: React Hook Form + Zod validation                     │  │
│  │  UI: Radix UI + Tailwind CSS + shadcn/ui                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                          HTTPS / WSS
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                          API LAYER                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              FastAPI + Uvicorn (ASGI)                         │  │
│  │                                                               │  │
│  │  Middleware Pipeline (ordered):                               │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐   │  │
│  │  │  CORS   │→│ Security │→│ Request  │→│  Auth/RBAC     │   │  │
│  │  │         │ │ Headers  │ │ ID       │ │  Dependency     │   │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └────────────────┘   │  │
│  │                                                               │  │
│  │  API Versioning: /api/v1/*                                    │  │
│  │  Documentation: Auto-generated OpenAPI (Swagger/ReDoc)        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                        SERVICE LAYER                                 │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────────────┐ │
│  │   Repository     │ │   ML Service    │ │   Business Logic      │ │
│  │   Pattern        │ │   Layer         │ │   Services            │ │
│  │                  │ │                 │ │                       │ │
│  │  ┌────────────┐  │ │  ┌───────────┐  │ │  ┌─────────────────┐ │ │
│  │  │  Base Repo  │  │ │  │ ARIMA     │  │ │  │ Notification    │ │ │
│  │  │  User Repo  │  │ │  │ RandomF   │  │ │  │ Scheduling      │ │ │
│  │  │  Emp Repo   │  │ │  │ Risk      │  │ │  │ Workload        │ │ │
│  │  │  Role Repo  │  │ │  │ Recs      │  │ │  │ Report Gen      │ │ │
│  │  └────────────┘  │ │  └───────────┘  │ │  └─────────────────┘ │ │
│  └─────────────────┘ └─────────────────┘ └───────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                     │
│  ┌────────────────┐ ┌──────────────┐ ┌───────────────────────────┐ │
│  │   PostgreSQL 16 │ │   Redis 7    │ │   Celery Workers          │ │
│  │   (Primary DB)  │ │   (Cache/MQ) │ │   (Background Tasks)      │ │
│  │                 │ │              │ │                           │ │
│  │  ┌───────────┐  │ │  ┌────────┐  │ │  ┌─────────────────────┐ │ │
│  │  │ Async ORM  │  │ │  │ Cache  │  │ │  │ ML Training Jobs    │ │ │
│  │  │ (SQLAlchemy)│  │ │  │ Session│  │ │  │ Report Generation   │ │ │
│  │  │ Pool: 20/40│  │ │  │ PubSub │  │ │  │ Notification Send   │ │ │
│  │  └───────────┘  │ │  └────────┘  │ │  └─────────────────────┘ │ │
│  └────────────────┘ └──────────────┘ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App (TanStack Start SSR)
├── RootLayout
│   ├── AuthProvider (JWT context)
│   └── QueryClientProvider (React Query)
│
├── Public Routes
│   ├── / (Landing page)
│   ├── /login (Authentication)
│   ├── /forgot-password
│   └── /reset-password
│
└── Protected Routes (/app/*)
    ├── AppLayout
    │   ├── Sidebar (Navigation)
    │   ├── Header
    │   │   ├── NotificationBell (WebSocket)
    │   │   └── UserMenu
    │   └── MainContent
    │
    ├── /app/dashboard
    │   ├── ExecutiveSummaryBanner
    │   ├── KpiCards (4 metrics)
    │   ├── RecommendationCards
    │   ├── EnrollmentChart (AreaChart)
    │   ├── RetentionChart (LineChart)
    │   ├── RiskHeatmap
    │   └── WorkloadCharts (Bar/Pie)
    │
    ├── /app/reports
    │   ├── ReportHeader
    │   ├── QuickSummary
    │   ├── ExecutiveSummaryView
    │   ├── EnrollmentForecastView
    │   ├── TeacherRetentionView
    │   ├── WorkforceAllocationView
    │   ├── PerformanceAnalysisView
    │   ├── RiskAssessmentView
    │   ├── SkillGapView
    │   ├── SchedulingEfficiencyView
    │   ├── PredictiveAnalyticsView
    │   ├── RecommendationsView
    │   └── AuditView
    │
    ├── /app/predictive
    ├── /app/allocation
    ├── /app/risk
    ├── /app/recommendations
    ├── /app/employees
    ├── /app/scheduling
    ├── /app/workload
    ├── /app/matching
    ├── /app/notifications
    ├── /app/audit
    ├── /app/settings
    └── /app/profile
```

### Backend Layered Architecture

```
Request Flow:
═════════════

HTTP Request
    │
    ▼
┌─────────────────────────────────────────┐
│  Middleware Pipeline                     │
│  1. CORSMiddleware (origin check)       │
│  2. SecurityHeadersMiddleware (HSTS)    │
│  3. RequestIdMiddleware (UUID tracking) │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Route Handler (API Layer)              │
│  - Path: /api/v1/{resource}             │
│  - Method: GET/POST/PUT/DELETE           │
│  - Auth: Depends(get_current_user)      │
│  - RBAC: Depends(require_permission())  │
│  - Validation: Pydantic schemas         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Service Layer                          │
│  - Business logic                       │
│  - Data transformation                  │
│  - ML model invocation                  │
│  - Cross-cutting concerns               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Repository Layer (Data Access)         │
│  - CRUD operations                      │
│  - Query building                       │
│  - Transaction management               │
│  - Caching (Redis)                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Database Layer                         │
│  - SQLAlchemy ORM (async)               │
│  - PostgreSQL connection pool            │
│  - Parameterized queries                │
└─────────────────────────────────────────┘
                 │
                 ▼
HTTP Response (JSON)
```

---

## Data Flow Diagrams

### Authentication Flow

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │  API    │     │ Auth     │     │ Database   │
└───┬────┘     └────┬────┘     └────┬─────┘     └─────┬──────┘
    │               │               │                  │
    │ POST /login   │               │                  │
    │──────────────>│               │                  │
    │               │ validate JWT  │                  │
    │               │──────────────>│                  │
    │               │               │ query user       │
    │               │               │─────────────────>│
    │               │               │ user + roles     │
    │               │               │<─────────────────│
    │               │               │ verify Argon2    │
    │               │               │ password hash    │
    │               │               │                  │
    │               │               │ check lockout    │
    │               │               │ update last_login│
    │               │               │─────────────────>│
    │               │               │                  │
    │               │ generate JWT  │                  │
    │               │<──────────────│                  │
    │  { access,   │               │                  │
    │    refresh }  │               │                  │
    │<──────────────│               │                  │
    │               │               │                  │
    │ GET /me       │               │                  │
    │ + Bearer      │               │                  │
    │──────────────>│               │                  │
    │               │ verify token  │                  │
    │               │──────────────>│                  │
    │               │               │ query user       │
    │               │               │─────────────────>│
    │               │               │                  │
    │  { user }     │               │                  │
    │<──────────────│               │                  │
```

### ML Prediction Flow

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │  API    │     │ ML Svc   │     │ Database   │
└───┬────┘     └────┬────┘     └────┬─────┘     └─────┬──────┘
    │               │               │                  │
    │ POST /analytics/enrollment    │                  │
    │ { historical_data }           │                  │
    │──────────────>│               │                  │
    │               │ auth check    │                  │
    │               │──────────────>│                  │
    │               │               │                  │
    │               │ create service│                  │
    │               │──────────────>│                  │
    │               │               │ run_in_thread()  │
    │               │               │ ┌──────────────┐ │
    │               │               │ │ Feature Eng  │ │
    │               │               │ │ Preprocessing│ │
    │               │               │ │ ARIMA Fit    │ │
    │               │               │ │ Forecast     │ │
    │               │               │ │ Confidence   │ │
    │               │               │ └──────────────┘ │
    │               │               │                  │
    │               │ PredictionResult                  │
    │               │<──────────────│                  │
    │  { forecast,  │               │                  │
    │    intervals, │               │                  │
    │    confidence }               │                  │
    │<──────────────│               │                  │
    │               │               │                  │
    │ Dashboard renders Recharts    │                  │
    └───────────────┘               └──────────────────┘
```

### Notification Flow (WebSocket)

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │  WS     │     │ Notif    │     │ Redis      │
│ (React)│     │ Server  │     │ Service  │     │ PubSub     │
└───┬────┘     └────┬────┘     └────┬─────┘     └─────┬──────┘
    │               │               │                  │
    │ WS connect    │               │                  │
    │ /ws/notifs/id │               │                  │
    │──────────────>│               │                  │
    │               │ register      │                  │
    │               │ connection    │                  │
    │               │               │                  │
    │               │               │ publish event    │
    │               │               │─────────────────>│
    │               │               │                  │
    │               │ subscribe     │                  │
    │               │─────────────────────────────────>│
    │               │               │                  │
    │               │ new notif     │                  │
    │               │<─────────────────────────────────│
    │               │               │                  │
    │ WS message    │               │                  │
    │ { notification }              │                  │
    │<──────────────│               │                  │
    │               │               │                  │
    │ Bell badge    │               │                  │
    │ updates       │               │                  │
    └───────────────┘               └──────────────────┘
```

---

## Middleware Pipeline

### Request Processing Order

```
1. CORSMiddleware
   └── Validates Origin header against allowed origins
   └── Sets Access-Control-* headers

2. SecurityHeadersMiddleware
   └── X-Content-Type-Options: nosniff
   └── X-Frame-Options: DENY
   └── X-XSS-Protection: 1; mode=block
   └── Strict-Transport-Security (HSTS)
   └── Content-Security-Policy (CSP)

3. RequestIdMiddleware
   └── Generates UUID for each request
   └── Adds X-Request-ID to response headers
   └── Stores in request.state for logging

4. Authentication (per-route dependency)
   └── Extracts Bearer token from Authorization header
   └── Validates JWT signature and expiration
   └── Loads user from database with roles
   └── Returns 401/403 on failure

5. RBAC (per-route dependency)
   └── Checks user roles against required roles
   └── Checks user permissions against required permissions
   └── Superusers bypass all permission checks
   └── Returns 403 on failure
```

---

## API Versioning Strategy

### URL-Based Versioning

All API endpoints are versioned using URL prefix:

```
/api/v1/auth/login
/api/v1/users
/api/v1/analytics/enrollment
```

### Versioning Rules

1. **Minor changes** (new fields, optional parameters) → No version bump
2. **Breaking changes** (removed fields, changed types) → New version (`/api/v2/`)
3. **Deprecation** → 6-month notice with `Sunset` header

---

## Deployment Architecture

### Development

```
Local Machine
├── Frontend: Vite dev server (localhost:5173)
├── Backend: Uvicorn with --reload (localhost:8000)
├── Database: PostgreSQL (localhost:5432)
├── Cache: Redis (localhost:6379)
└── Celery: Worker process
```

### Production

```
Cloudflare Workers (Frontend)
├── Edge-deployed globally
├── SSR with TanStack Start
├── Automatic scaling
└── Zero-config deployment

Backend Services (Docker Compose → Kubernetes)
├── API: FastAPI + Uvicorn (port 8000)
├── Worker: Celery background tasks
├── Database: PostgreSQL 16 (persistent volume)
├── Cache: Redis 7 (persistent volume)
└── Load Balancer: Nginx/HAProxy
```

---

## Error Handling Architecture

### Consistent Error Responses

All errors follow a standardized JSON format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "detail": "Additional context",
  "path": "/api/v1/resource"
}
```

### Exception Hierarchy

```
BaseException
├── HTTPException (FastAPI built-in)
├── InvalidTokenException
│   └── TokenExpiredException
├── ValidationException (Pydantic)
├── NotFoundException
├── ConflictException
├── UnauthorizedException
└── ForbiddenException
```

### Error Code Registry

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `CONFLICT` | 409 | Resource conflict |
| `VALIDATION_ERROR` | 422 | Invalid input |
| `DATABASE_ERROR` | 500 | Database error |
| `LOCKED` | 403 | Account locked |
| `TOKEN_EXPIRED` | 401 | Token expired |

---

## Logging Architecture

### Structured Logging

```python
# Development: Human-readable format
2024-01-15 10:30:45 [INFO] app.api.v1.auth: User logged in: admin@school.edu

# Production: JSON format
{
  "timestamp": "2024-01-15T10:30:45Z",
  "level": "INFO",
  "logger": "app.api.v1.auth",
  "message": "User logged in",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ip": "192.168.1.100"
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `DEBUG` | Development debugging |
| `INFO` | Normal operations (login, API calls) |
| `WARNING` | Degraded performance, retryable errors |
| `ERROR` | Failed operations, exceptions |
| `CRITICAL` | System-level failures |

---

## Scalability Considerations

### Horizontal Scaling

```
Current: Single API instance
├── Stateless design (no server-side sessions)
├── JWT tokens enable multi-instance auth
├── Database connection pooling (20/40)
└── Ready for load balancer insertion

Future: Multiple API instances
├── Add load balancer (HAProxy/Nginx)
├── Add PgBouncer for connection pooling
├── Add Redis Sentinel for HA
└── Kubernetes HPA for auto-scaling
```

### Vertical Scaling

```
Current: Single PostgreSQL instance
├── Connection pool: 20 base, 40 overflow
├── Strategic indexes on hot paths
├── Materialized views for analytics
└── Query optimization

Future: Read replicas
├── Primary: Write operations
├── Replicas: Read-heavy analytics
├── Connection routing by query type
└── CQRS pattern for complex queries
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────┐
│ Layer 1: Transport (HTTPS/TLS)              │
├─────────────────────────────────────────────┤
│ Layer 2: Security Headers (HSTS, CSP)       │
├─────────────────────────────────────────────┤
│ Layer 3: CORS (Origin Validation)           │
├─────────────────────────────────────────────┤
│ Layer 4: JWT Authentication                 │
├─────────────────────────────────────────────┤
│ Layer 5: RBAC Authorization                 │
├─────────────────────────────────────────────┤
│ Layer 6: Password Hashing (Argon2id)        │
├─────────────────────────────────────────────┤
│ Layer 7: Account Lockout (5/15)             │
├─────────────────────────────────────────────┤
│ Layer 8: Audit Logging                      │
├─────────────────────────────────────────────┤
│ Layer 9: Request ID Tracking                │
└─────────────────────────────────────────────┘
```

### Data Protection

- **Passwords:** Argon2id hashing (memory-hard, GPU-resistant)
- **Tokens:** HS256 JWT with configurable expiration
- **Sensitive Fields:** Excluded from API responses by default
- **Database:** Parameterized queries (SQLAlchemy ORM)
- **Transport:** HTTPS enforced in production

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Framework | FastAPI | Async-first, auto OpenAPI, Pydantic v2 |
| ORM | SQLAlchemy 2.0 | Async support, mature ecosystem |
| Database | PostgreSQL 16 | JSONB support, reliability, extensions |
| Cache | Redis 7 | Pub/Sub for WebSocket, session store |
| Task Queue | Celery | Mature, Redis broker, monitoring |
| Frontend | React 19 + TanStack | Type safety, file routing, SSR |
| Charts | Recharts | Declarative, composable, performant |
| UI Components | Radix UI + shadcn | Accessible, customizable, modern |
| CSS | Tailwind CSS 4 | Utility-first, fast development |
| Deployment | Cloudflare Workers | Edge performance, auto-scaling |
| Password Hash | Argon2id | Memory-hard, GPU-resistant |
| JWT Library | PyJWT | Standard, well-maintained |