# Scalability Plan — WorkforceIQ EDU

## Overview

This document outlines the current architecture, expected growth trajectories, and scaling strategies for WorkforceIQ EDU as it transitions from a single-institution deployment to a multi-tenant SaaS platform.

---

## Current Architecture

### Infrastructure Snapshot

| Component | Technology | Configuration |
|-----------|-----------|---------------|
| Frontend | React 19 + TanStack Start | Cloudflare Workers (edge) |
| Backend | FastAPI + Uvicorn | Single instance, async |
| Database | PostgreSQL 16 | Single instance, connection pool |
| Cache | Redis 7 | Single instance |
| Task Queue | Celery + Redis | Single worker |
| ML Models | scikit-learn + statsmodels | In-memory, CPU-bound |

### Current Capacity

| Metric | Current | Limit |
|--------|---------|-------|
| Concurrent Users | ~50 | 200 |
| API Requests/min | ~500 | 2,000 |
| Database Connections | 20 base + 40 overflow | 60 |
| ML Inference Latency | < 200ms | < 1s |
| Storage | ~1 GB | 10 GB |

---

## Growth Projections

### Phase 1: Single Institution (Current)

```
Users: 50-100
Departments: 10-20
Employees: 50-200
Students: 1,000-5,000
Concurrent Sessions: 20-50
```

**Architecture:** Single server, shared database

### Phase 2: Multi-Institution Pilot (6-12 months)

```
Users: 500-1,000
Organizations: 5-10
Departments: 50-100
Employees: 500-2,000
Students: 10,000-50,000
Concurrent Sessions: 100-300
```

**Architecture:** Horizontal scaling, read replicas

### Phase 3: SaaS Production (12-24 months)

```
Users: 5,000-10,000
Organizations: 50-100
Departments: 500-1,000
Employees: 5,000-20,000
Students: 100,000-500,000
Concurrent Sessions: 500-2,000
```

**Architecture:** Multi-region, Kubernetes, CDN

---

## Scaling Strategies

### Database Scaling

#### Connection Pooling

```
Current:
├── Pool Size: 20 base connections
├── Max Overflow: 40 burst connections
├── Pre-ping: Enabled
└── Timeout: 30 seconds

Phase 2:
├── Add PgBouncer connection pooler
├── Pool Size: 100-200 connections
├── Transaction-level pooling
└── Connection routing
```

#### Read Replicas

```
Phase 2:
├── Primary: Write operations only
├── Replica 1: Read-heavy analytics
├── Replica 2: Dashboard queries
└── Routing: Application-level routing

Phase 3:
├── Primary: Write operations
├── Read Replicas: 3-5 instances
├── CQRS: Command Query Responsibility Segregation
└── Materialized Views: Pre-computed analytics
```

#### Horizontal Sharding (Phase 3)

```
Strategy: Tenant-based sharding
├── Shard Key: organization_id
├── Shard 1: Organizations A-F
├── Shard 2: Organizations G-M
├── Shard 3: Organizations N-T
├── Shard 4: Organizations U-Z
└── Routing: Consistent hashing
```

### API Scaling

#### Horizontal Scaling

```
Current:
├── Single API instance
├── Stateless design (JWT)
├── Connection pooling
└── Ready for load balancer

Phase 2:
├── 2-4 API instances
├── Load balancer (HAProxy/Nginx)
├── Sticky sessions: None (stateless)
└── Health checks: /health endpoint

Phase 3:
├── Kubernetes Deployment
├── HPA (Horizontal Pod Autoscaler)
├── Min: 3 pods, Max: 20 pods
├── CPU target: 70%
└── Memory target: 80%
```

#### Load Balancer Configuration

```nginx
# Nginx load balancer config
upstream api_backend {
    least_conn;  # Route to least connections
    
    server api-1:8000 weight=5;
    server api-2:8000 weight=5;
    server api-3:8000 weight=3;
    
    keepalive 32;  # Connection pooling
}

server {
    listen 443 ssl;
    
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
    }
}
```

### Frontend Scaling

#### CDN Strategy

```
Current:
├── Cloudflare Workers (edge-deployed)
├── Automatic global distribution
├── Edge caching for static assets
└── Zero-config deployment

Phase 2:
├── Add Cloudflare CDN for assets
├── Cache-Control headers
├── Asset fingerprinting
└── Pre-compression (Brotli)

Phase 3:
├── Multi-region edge deployment
├── A/B testing at edge
├── Personalization at edge
└── Edge-side rendering
```

#### Bundle Optimization

```javascript
// Code splitting by route
const Dashboard = lazy(() => import('./routes/app.dashboard'));
const Reports = lazy(() => import('./routes/app.reports'));
const Analytics = lazy(() => import('./routes/app.predictive'));

// Shared vendor chunks
// vendor-chunk.js: React, TanStack, Radix UI
// charts-chunk.js: Recharts
// ml-chunk.js: ML visualization components
```

### Cache Scaling

```
Current:
├── Redis single instance
├── In-memory caching
├── Session storage
└── Celery broker

Phase 2:
├── Redis Sentinel (HA)
├── Primary + 2 replicas
├── Automatic failover
└── Cache-aside pattern

Phase 3:
├── Redis Cluster
├── 6 nodes (3 primary + 3 replica)
├── Sharded keys
└── Distributed caching
```

### ML Scaling

```
Current:
├── In-memory model execution
├── CPU-bound (asyncio.to_thread)
├── Synchronous training
└── Single-node inference

Phase 2:
├── Model caching (Redis)
├── Batch prediction API
├── Model versioning (MLflow)
└── Background retraining

Phase 3:
├── GPU-accelerated inference
├── Model serving (TensorFlow Serving)
├── A/B model testing
└── Online learning pipeline
```

---

## Containerization

### Docker Compose (Current)

```yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [db, redis]
    
  worker:
    build: .
    command: celery -A app.core.celery_app:celery_app worker
    depends_on: [db, redis]
    
  db:
    image: postgres:16
    volumes: [data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
```

### Kubernetes Migration (Phase 3)

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workforceiq-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    spec:
      containers:
      - name: api
        image: workforceiq/api:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
---
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workforceiq-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Multi-Tenant SaaS Architecture

### Tenant Isolation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tenant A     │  │  Tenant B     │  │  Tenant C     │      │
│  │  (School 1)   │  │  (School 2)   │  │  (School 3)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│  ┌──────┴──────────────────┴──────────────────┴───────┐     │
│  │              Shared API Layer                        │     │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐            │     │
│  │  │  Auth   │ │  RBAC    │ │  Tenant  │            │     │
│  │  │         │ │          │ │  Context │            │     │
│  │  └─────────┘ └──────────┘ └──────────┘            │     │
│  └───────────────────────┬────────────────────────────┘     │
│                          │                                   │
│  ┌───────────────────────┴────────────────────────────┐     │
│  │              Shared Database                        │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  organization_id (Tenant Isolation Key)      │  │     │
│  │  │  All queries filtered by organization_id     │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Context Middleware

```python
class TenantContextMiddleware:
    """Extract and set tenant context from JWT token."""
    
    async def __call__(self, request: Request, call_next):
        # Extract tenant from JWT
        if hasattr(request.state, "user"):
            request.state.tenant_id = request.state.user.organization_id
        
        response = await call_next(request)
        return response
```

### Query Scoping

```python
class TenantScopedRepository:
    """Base repository with automatic tenant filtering."""
    
    def __init__(self, db: AsyncSession, tenant_id: str):
        self.db = db
        self.tenant_id = tenant_id
    
    async def get_all(self, model):
        return await self.db.execute(
            select(model).where(
                model.organization_id == self.tenant_id
            )
        )
```

---

## Performance Monitoring

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p50) | < 100ms | > 200ms |
| API Response Time (p99) | < 500ms | > 1s |
| Database Query Time | < 50ms | > 100ms |
| ML Inference Time | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| CPU Utilization | < 70% | > 85% |
| Memory Utilization | < 80% | > 90% |
| Connection Pool Usage | < 50% | > 80% |

### Monitoring Stack

```
Phase 1 (Current):
├── Application logs (structured JSON)
├── Health check endpoint
└── Manual performance testing

Phase 2:
├── Prometheus metrics export
├── Grafana dashboards
├── Alertmanager notifications
└── Distributed tracing (Jaeger)

Phase 3:
├── Full observability stack
├── APM (Application Performance Monitoring)
├── Real User Monitoring (RUM)
└── Synthetic monitoring
```

---

## Disaster Recovery

### Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| PostgreSQL | pg_dump + WAL | Daily + continuous | 30 days |
| Redis | RDB + AOF | Every 6 hours | 7 days |
| ML Models | File copy | On training | 10 versions |
| Application Config | Git | On change | All history |

### Recovery Procedures

```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 1 hour

Recovery Steps:
1. Provision new infrastructure (Terraform)
2. Restore database from latest backup
3. Apply pending migrations
4. Deploy application from container registry
5. Verify health checks
6. Update DNS/load balancer
7. Monitor for errors
```

---

## Cost Optimization

### Resource Right-Sizing

```
Current:
├── API: 2 vCPU, 4 GB RAM
├── Database: 2 vCPU, 8 GB RAM
├── Redis: 1 vCPU, 2 GB RAM
└── Total: ~$200/month

Phase 2:
├── API: 4 vCPU, 8 GB RAM (x2)
├── Database: 4 vCPU, 16 GB RAM
├── Redis: 2 vCPU, 4 GB RAM
├── Load Balancer: 1 instance
└── Total: ~$800/month

Phase 3 (Kubernetes):
├── API Pods: 3-20 (auto-scaling)
├── Database: Managed PostgreSQL
├── Redis: Managed Redis Cluster
├── CDN: Cloudflare Pro
└── Total: ~$2,000-5,000/month
```

### Cost Optimization Strategies

1. **Auto-scaling** — Scale down during off-hours
2. **Reserved instances** — 1-year commitment for 40% savings
3. **Spot instances** — For non-critical workloads (ML training)
4. **CDN caching** — Reduce origin requests by 80%
5. **Database optimization** — Reduce query costs via indexing

---

## Capacity Planning

### Database Storage Growth

```
Current: 1 GB
├── Users: 100 records × 1 KB = 100 KB
├── Employees: 500 records × 2 KB = 1 MB
├── Notifications: 10,000 records × 1 KB = 10 MB
├── Audit Logs: 50,000 records × 0.5 KB = 25 MB
├── ML Models: 10 MB
└── Overhead: ~500 MB

Phase 3: 100 GB
├── Users: 10,000 records
├── Employees: 50,000 records
├── Notifications: 1,000,000 records
├── Audit Logs: 10,000,000 records
├── ML Models: 1 GB
└── Indexes: 10 GB
```

### API Traffic Growth

```
Current: 500 requests/minute
├── Dashboard: 100 req/min
├── Analytics: 200 req/min
├── CRUD: 150 req/min
└── ML: 50 req/min

Phase 3: 10,000 requests/minute
├── Dashboard: 2,000 req/min
├── Analytics: 4,000 req/min
├── CRUD: 3,000 req/min
└── ML: 1,000 req/min
```

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

- [ ] Add Redis caching layer
- [ ] Implement connection pooling
- [ ] Add health check monitoring
- [ ] Set up structured logging
- [ ] Create backup automation

### Phase 2: Horizontal Scaling (Months 4-9)

- [ ] Deploy load balancer
- [ ] Add read replicas
- [ ] Implement Redis Sentinel
- [ ] Add Prometheus/Grafana
- [ ] Create Kubernetes manifests

### Phase 3: SaaS Platform (Months 10-18)

- [ ] Multi-tenant middleware
- [ ] Tenant isolation enforcement
- [ ] Kubernetes deployment
- [ ] Auto-scaling policies
- [ ] Multi-region CDN

### Phase 4: Enterprise (Months 19-24)

- [ ] SSO integration
- [ ] Advanced RBAC
- [ ] Compliance certifications
- [ ] SLA monitoring
- [ ] Enterprise support