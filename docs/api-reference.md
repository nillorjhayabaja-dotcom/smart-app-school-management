# API Reference — WorkforceIQ EDU

## Overview

WorkforceIQ EDU provides a RESTful API with versioned endpoints under `/api/v1/`. All responses are JSON-formatted with consistent error handling.

**Base URL:** `https://workforceiq-edu.rjabaja.workers.dev/api/v1`

**Interactive Documentation:**
- Swagger UI: `http://localhost:8000/docs` (development only)
- ReDoc: `http://localhost:8000/redoc` (development only)

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

```
Login → Access Token (30 min) + Refresh Token (7 days)
    ↓
API Requests with Access Token
    ↓
401 Token Expired → Refresh → New Access Token
    ↓
Continue API Requests
```

---

## Authentication APIs

### POST `/auth/login`

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "admin@school.edu",
  "password": "Admin@123456"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Error (401):**
```json
{
  "error": true,
  "message": "Invalid email or password",
  "error_code": "UNAUTHORIZED"
}
```

**Error (403 - Locked):**
```json
{
  "error": true,
  "message": "Account is temporarily locked due to too many failed login attempts",
  "error_code": "LOCKED"
}
```

---

### POST `/auth/refresh`

Refresh an expired access token using a valid refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

---

### POST `/auth/logout`

Logout the current user. (Currently stateless; TODO: Redis token blacklist)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

### GET `/auth/me`

Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@school.edu",
  "first_name": "Admin",
  "last_name": "User",
  "full_name": "Admin User",
  "is_superuser": true,
  "is_verified": true,
  "last_login": "2024-01-15T10:30:00Z",
  "roles": ["admin"]
}
```

---

### PUT `/auth/password`

Change the current user's password.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "current_password": "Admin@123456",
  "new_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

## User Management APIs

### GET `/users`

List users with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page |
| `search` | string | - | Search by name/email |

**Response (200):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@school.edu",
      "first_name": "Admin",
      "last_name": "User",
      "full_name": "Admin User",
      "is_superuser": true,
      "roles": ["admin"]
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 1
}
```

---

### POST `/users`

Create a new user.

**Headers:** `Authorization: Bearer <token>`
**Permission:** `users:create`

**Request:**
```json
{
  "email": "teacher@school.edu",
  "password": "TeacherPass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+639123456789"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "teacher@school.edu",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "is_superuser": false,
  "roles": []
}
```

---

### GET `/users/{id}`

Get user by ID.

---

### PUT `/users/{id}`

Update user details.

---

### DELETE `/users/{id}`

Delete a user.

---

### GET `/users/{id}/roles`

Get roles assigned to a user.

**Response (200):**
```json
{
  "roles": [
    {
      "id": "role-uuid",
      "name": "teacher",
      "description": "Basic read access",
      "level": 40
    }
  ]
}
```

---

### POST `/users/{id}/roles`

Assign a role to a user.

**Request:**
```json
{
  "role_id": "role-uuid",
  "notes": "Assigned as department teacher"
}
```

---

### DELETE `/users/{id}/roles/{role_id}`

Remove a role from a user.

---

## Employee Management APIs

### GET `/employees`

List employees with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `department_id` | UUID | Filter by department |
| `status` | string | Filter by status (active/inactive/on_leave) |
| `page` | int | Page number |
| `limit` | int | Items per page |

---

### GET `/employees/{id}`

Get employee details with department and user relationships.

**Response (200):**
```json
{
  "id": "emp-uuid",
  "employee_number": "EMP-001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@school.edu",
  "department": {
    "id": "dept-uuid",
    "name": "Mathematics",
    "code": "MATH"
  },
  "position": "Senior Teacher",
  "employment_type": "full_time",
  "hire_date": "2020-06-15",
  "status": "active",
  "workload": 75,
  "performance": 88,
  "retention_risk": "low",
  "years_of_service": 4.0
}
```

---

## Analytics APIs

### POST `/analytics/enrollment`

Run enrollment forecasting model.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "historical_enrollment": [1200, 1250, 1300, 1280, 1350, 1400, 1380, 1420, 1450, 1500],
  "forecast_years": 3,
  "confidence_level": 0.95
}
```

**Response (200):**
```json
{
  "data": {
    "forecast": [1530, 1565, 1600],
    "confidence_lower": [1480, 1460, 1420],
    "confidence_upper": [1580, 1670, 1780],
    "model_accuracy": 0.94,
    "historical_years": 10,
    "forecast_years": 3
  },
  "meta": {
    "model": "ARIMA(1,1,1)",
    "alpha": 0.05,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### POST `/analytics/retention`

Run teacher retention prediction.

**Request:**
```json
{
  "employees": [
    {
      "workload": 75,
      "performance": 88,
      "tenure_years": 4,
      "department": "Mathematics"
    }
  ]
}
```

**Response (200):**
```json
{
  "data": {
    "predictions": [
      {
        "retention_probability": 0.87,
        "risk_level": "low",
        "confidence": 0.92
      }
    ]
  },
  "meta": {
    "model": "RandomForestRegressor",
    "estimators": 400
  }
}
```

---

### POST `/analytics/trend`

Identify trends in data.

**Request:**
```json
{
  "x": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  "y": [1200, 1250, 1300, 1280, 1350, 1400, 1380, 1420, 1450, 1500]
}
```

**Response (200):**
```json
{
  "data": {
    "trend": "increasing",
    "slope": 28.5,
    "r_squared": 0.94,
    "seasonality": false
  }
}
```

---

### GET `/analytics/workload/distribution`

Get workload distribution across departments.

---

### GET `/analytics/scatter`

Get performance vs workload scatter data.

---

### GET `/analytics/activity`

Get active vs inactive employee distribution.

---

## Risk Assessment APIs

### GET `/risk`

Get risk assessment data across departments.

**Response (200):**
```json
[
  {
    "department": "Mathematics",
    "low": 8,
    "medium": 3,
    "high": 1
  },
  {
    "department": "Science",
    "low": 6,
    "medium": 4,
    "high": 2
  }
]
```

---

## Recommendations APIs

### GET `/recommendations`

Get AI-generated workforce recommendations.

**Response (200):**
```json
[
  {
    "id": "rec-uuid",
    "title": "Hire 2 additional Science teachers by next semester",
    "category": "allocation",
    "impact": "high",
    "confidence": 0.89,
    "description": "Science department is approaching critical staffing levels...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## Report APIs

### GET `/reports`

Generate comprehensive workforce reports.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Report type (executive, enrollment, retention, etc.) |
| `format` | string | Output format (json, pdf) |

---

## Notification APIs

### GET `/notifications`

List notifications for the current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `limit` | int | Items per page |
| `category` | string | Filter by category |
| `is_read` | boolean | Filter by read status |

---

### POST `/notifications`

Create a new notification.

**Permission:** `notifications:create`

**Request:**
```json
{
  "user_id": "user-uuid",
  "title": "Enrollment Alert",
  "message": "Enrollment has exceeded capacity in Mathematics department",
  "category": "enrollment",
  "priority": "HIGH",
  "action_url": "/app/predictive"
}
```

---

### WebSocket `/ws/notifications/{user_id}`

Real-time notification delivery via WebSocket.

**Connection:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${userId}`);

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Update UI with new notification
};
```

**Message Format:**
```json
{
  "type": "notification",
  "data": {
    "id": "notif-uuid",
    "title": "Risk Alert",
    "message": "High retention risk detected in Science department",
    "category": "risk",
    "priority": "CRITICAL"
  }
}
```

---

## Audit Log APIs

### GET `/audit-logs`

Get audit log entries.

**Headers:** `Authorization: Bearer <token>`
**Permission:** `audit:read`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `limit` | int | Items per page |
| `action` | string | Filter by action type |
| `user_id` | UUID | Filter by user |

---

## Workload APIs

### GET `/workload`

Get workload analytics data.

---

## Scheduling APIs

### GET `/scheduling`

Get schedule data.

---

## Settings APIs

### GET `/settings`

Get system settings.

---

## Error Responses

All API errors follow a consistent format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "detail": "Additional context (optional)",
  "path": "/api/v1/resource"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (resource already exists) |
| 422 | Validation Error (invalid input) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Authenticated | 1000 requests | per hour |
| Unauthenticated | 100 requests | per hour |
| Login | 10 attempts | per 15 minutes |

---

## Pagination

All list endpoints support pagination:

```
GET /api/v1/users?page=2&limit=20

Response includes:
{
  "data": [...],
  "total": 100,
  "page": 2,
  "pages": 5
}