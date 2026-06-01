"""
Notification API endpoints.

Provides RESTful endpoints for:
- Listing, creating, and managing notifications
- Marking notifications as read
- Archiving and deleting notifications
- Managing notification preferences
- Notification statistics
- Audit log access
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.models.notification import NotificationCategory, NotificationPriority

router = APIRouter()


# ── Local request schemas (lightweight, API-layer only) ────────────

class NotificationCreateRequest(BaseModel):
    user_id: Optional[str] = None
    title: str
    message: str
    category: str
    priority: str = "MEDIUM"
    action_url: Optional[str] = None
    metadata: Optional[dict] = None
    target_role: Optional[str] = None
    target_department: Optional[str] = None


class NotificationReadRequest(BaseModel):
    notification_ids: list[str]


class PreferenceUpdateRequest(BaseModel):
    in_app_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None


class BulkPreferenceUpdateRequest(BaseModel):
    preferences: dict[str, PreferenceUpdateRequest]


# ── In-memory store for stub mode ──────────────────────────────────

_notifications: list[dict] = []
_pref_store: dict[str, dict] = {}  # key = f"{user_id}:{category}"
_audit_logs: list[dict] = []

# Seed some demo notifications
import time, uuid

_now = time.time()
_demo_notifications = [
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Workforce Imbalance Detected",
        "message": "Mathematics department requires 2 additional teachers based on projected enrollment growth of 14%.",
        "category": "workforce",
        "priority": "HIGH",
        "action_url": "/app/allocation",
        "metadata": {"department": "Mathematics", "deficit": 2},
        "target_role": "hr_admin",
        "target_department": "Mathematics",
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 3600,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "High Burnout Risk Alert",
        "message": "Teacher Maria Santos has a burnout probability of 89%. Immediate intervention recommended.",
        "category": "risk",
        "priority": "CRITICAL",
        "action_url": "/app/risk",
        "metadata": {"teacher_name": "Maria Santos", "burnout_score": 89},
        "target_role": None,
        "target_department": None,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 1800,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Enrollment Growth Forecast",
        "message": "Projected STEM enrollment increased by 14% next school year. Prepare infrastructure and staffing accordingly.",
        "category": "enrollment",
        "priority": "MEDIUM",
        "action_url": "/app/predictive",
        "metadata": {"growth_percentage": 14, "strand": "STEM"},
        "target_role": "department_head",
        "target_department": "Sciences",
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 7200,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Schedule Conflict Detected",
        "message": "Schedule conflict found for Teacher Cruz on Tuesday at 10:00 AM. Two classes assigned to R-104.",
        "category": "scheduling",
        "priority": "HIGH",
        "action_url": "/app/scheduling",
        "metadata": {"teacher_name": "Cruz", "day": "Tuesday", "time": "10:00", "room": "R-104"},
        "target_role": None,
        "target_department": None,
        "is_read": True,
        "read_at": _now - 3000,
        "is_archived": False,
        "created_at": _now - 10800,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "ML Recommendation: Hire STEM Teachers",
        "message": "Based on enrollment forecasts and current workload analysis, hiring 3 additional STEM teachers is recommended.",
        "category": "recommendation",
        "priority": "HIGH",
        "action_url": "/app/recommendations",
        "metadata": {"recommendation_type": "hiring", "count": 3, "department": "STEM"},
        "target_role": "super_admin",
        "target_department": None,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 5400,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Performance Improvement Detected",
        "message": "Teacher performance improved by 12% this quarter. Training program effectiveness confirmed.",
        "category": "performance",
        "priority": "MEDIUM",
        "action_url": "/app/employees",
        "metadata": {"improvement": 12, "period": "Q3"},
        "target_role": None,
        "target_department": None,
        "is_read": True,
        "read_at": _now - 4000,
        "is_archived": False,
        "created_at": _now - 14400,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Certification Expiring Soon",
        "message": "Teacher certification expires in 30 days. Please ensure renewal is initiated.",
        "category": "performance",
        "priority": "MEDIUM",
        "action_url": "/app/employees",
        "metadata": {"days_remaining": 30},
        "target_role": "hr_admin",
        "target_department": None,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 21600,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "ARIMA Model Retrained",
        "message": "Enrollment forecasting ARIMA model has been successfully retrained with latest data.",
        "category": "system",
        "priority": "LOW",
        "action_url": None,
        "metadata": {"model": "ARIMA", "accuracy": "94.2%"},
        "target_role": "super_admin",
        "target_department": None,
        "is_read": True,
        "read_at": _now - 9000,
        "is_archived": False,
        "created_at": _now - 28800,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Failed Login Attempts Detected",
        "message": "5 failed login attempts detected for account admin@school.edu. Account may be compromised.",
        "category": "security",
        "priority": "CRITICAL",
        "action_url": "/app/audit",
        "metadata": {"attempts": 5, "account": "admin@school.edu"},
        "target_role": "super_admin",
        "target_department": None,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 600,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Database Backup Completed",
        "message": "Scheduled database backup completed successfully. Size: 2.4 GB.",
        "category": "system",
        "priority": "LOW",
        "action_url": None,
        "metadata": {"backup_size": "2.4 GB", "status": "success"},
        "target_role": "super_admin",
        "target_department": None,
        "is_read": True,
        "read_at": _now - 50000,
        "is_archived": False,
        "created_at": _now - 43200,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Teacher Retention Risk Increased",
        "message": "Teacher retention probability dropped below 50% for 3 teachers in the Sciences department.",
        "category": "risk",
        "priority": "HIGH",
        "action_url": "/app/risk",
        "metadata": {"affected_teachers": 3, "department": "Sciences", "retention_probability": 47},
        "target_role": "hr_admin",
        "target_department": "Sciences",
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 900,
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": None,
        "title": "Recommendation: Reassign ICT Classes",
        "message": "Reassigning ICT classes to underutilized teachers could improve workforce utilization by 18%.",
        "category": "recommendation",
        "priority": "MEDIUM",
        "action_url": "/app/recommendations",
        "metadata": {"utilization_improvement": 18, "action": "reassign"},
        "target_role": "department_head",
        "target_department": None,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": _now - 3600,
    },
]

_notifications = list(_demo_notifications)


# ── Endpoints ──────────────────────────────────────────────────────

@router.get("")
async def list_notifications(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """List notifications with filtering and pagination."""
    filtered = [n for n in _notifications if not n.get("is_archived") and n.get("deleted_at") is None]

    if category:
        filtered = [n for n in filtered if n["category"] == category]
    if priority:
        filtered = [n for n in filtered if n["priority"] == priority]
    if is_read is not None:
        filtered = [n for n in filtered if n["is_read"] == is_read]
    if search:
        search_lower = search.lower()
        filtered = [
            n for n in filtered
            if search_lower in n["title"].lower() or search_lower in n["message"].lower()
        ]

    total = len(filtered)
    unread_count = sum(1 for n in filtered if not n["is_read"])
    start = (page - 1) * page_size
    end = start + page_size
    paginated = filtered[start:end]

    return {
        "notifications": paginated,
        "total": total,
        "unread_count": unread_count,
        "page": page,
        "page_size": page_size,
        "has_more": end < total,
    }


@router.get("/unread")
async def get_unread_count() -> dict:
    """Get the count of unread notifications."""
    count = sum(1 for n in _notifications if not n["is_read"] and not n.get("is_archived") and n.get("deleted_at") is None)
    return {"count": count}


@router.post("")
async def create_notification(body: NotificationCreateRequest) -> dict:
    """Create a new notification."""
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": body.user_id,
        "title": body.title,
        "message": body.message,
        "category": body.category,
        "priority": body.priority,
        "action_url": body.action_url,
        "metadata": body.metadata,
        "target_role": body.target_role,
        "target_department": body.target_department,
        "is_read": False,
        "read_at": None,
        "is_archived": False,
        "created_at": time.time(),
    }
    _notifications.insert(0, notif)

    # Audit log
    _audit_logs.append({
        "id": str(uuid.uuid4()),
        "notification_id": notif["id"],
        "user_id": body.user_id,
        "action": "created",
        "details": {"title": notif["title"]},
        "created_at": time.time(),
    })

    return notif


@router.post("/read")
async def mark_notifications_read(body: NotificationReadRequest) -> dict:
    """Mark specific notifications as read."""
    updated = 0
    now = time.time()
    for n in _notifications:
        if n["id"] in body.notification_ids and not n["is_read"]:
            n["is_read"] = True
            n["read_at"] = now
            updated += 1
            _audit_logs.append({
                "id": str(uuid.uuid4()),
                "notification_id": n["id"],
                "action": "read",
                "details": {"title": n["title"]},
                "created_at": now,
            })
    return {"updated": updated}


@router.post("/read-all")
async def mark_all_read() -> dict:
    """Mark all notifications as read."""
    updated = 0
    now = time.time()
    for n in _notifications:
        if not n["is_read"] and not n.get("is_archived") and n.get("deleted_at") is None:
            n["is_read"] = True
            n["read_at"] = now
            updated += 1
    _audit_logs.append({
        "id": str(uuid.uuid4()),
        "action": "read_all",
        "details": {"count": updated},
        "created_at": now,
    })
    return {"updated": updated}


@router.post("/{notification_id}/archive")
async def archive_notification(notification_id: str) -> dict:
    """Archive a notification."""
    for n in _notifications:
        if n["id"] == notification_id:
            n["is_archived"] = True
            _audit_logs.append({
                "id": str(uuid.uuid4()),
                "notification_id": notification_id,
                "action": "archived",
                "created_at": time.time(),
            })
            return {"success": True}
    raise HTTPException(status_code=404, detail="Notification not found")


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str) -> dict:
    """Soft-delete a notification."""
    now = time.time()
    for n in _notifications:
        if n["id"] == notification_id:
            n["deleted_at"] = now
            _audit_logs.append({
                "id": str(uuid.uuid4()),
                "notification_id": notification_id,
                "action": "deleted",
                "created_at": now,
            })
            return {"success": True}
    raise HTTPException(status_code=404, detail="Notification not found")


# ── Preferences ────────────────────────────────────────────────────

@router.get("/preferences")
async def get_preferences(user_id: str = Query("default")) -> list[dict]:
    """Get notification preferences for a user."""
    categories = ["workforce", "risk", "scheduling", "enrollment", "recommendation", "performance", "security", "system"]
    prefs = []
    for cat in categories:
        key = f"{user_id}:{cat}"
        if key in _pref_store:
            prefs.append(_pref_store[key])
        else:
            prefs.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "category": cat,
                "in_app_enabled": True,
                "email_enabled": True,
                "push_enabled": True,
                "sms_enabled": False,
            })
    return prefs


@router.put("/preferences/{category}")
async def update_preference(
    category: str,
    body: PreferenceUpdateRequest,
    user_id: str = Query("default"),
) -> dict:
    """Update notification preference for a specific category."""
    key = f"{user_id}:{category}"
    existing = _pref_store.get(key, {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "category": category,
        "in_app_enabled": True,
        "email_enabled": True,
        "push_enabled": True,
        "sms_enabled": False,
    })

    if body.in_app_enabled is not None:
        existing["in_app_enabled"] = body.in_app_enabled
    if body.email_enabled is not None:
        existing["email_enabled"] = body.email_enabled
    if body.push_enabled is not None:
        existing["push_enabled"] = body.push_enabled
    if body.sms_enabled is not None:
        existing["sms_enabled"] = body.sms_enabled

    _pref_store[key] = existing
    return existing


@router.put("/preferences")
async def bulk_update_preferences(body: BulkPreferenceUpdateRequest) -> list[dict]:
    """Bulk update notification preferences."""
    results = []
    for category, updates in body.preferences.items():
        key = f"default:{category}"
        existing = _pref_store.get(key, {
            "id": str(uuid.uuid4()),
            "user_id": "default",
            "category": category,
            "in_app_enabled": True,
            "email_enabled": True,
            "push_enabled": True,
            "sms_enabled": False,
        })
        if updates.in_app_enabled is not None:
            existing["in_app_enabled"] = updates.in_app_enabled
        if updates.email_enabled is not None:
            existing["email_enabled"] = updates.email_enabled
        if updates.push_enabled is not None:
            existing["push_enabled"] = updates.push_enabled
        if updates.sms_enabled is not None:
            existing["sms_enabled"] = updates.sms_enabled
        _pref_store[key] = existing
        results.append(existing)
    return results


# ── Statistics ─────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats() -> dict:
    """Get notification statistics."""
    active = [n for n in _notifications if not n.get("is_archived") and n.get("deleted_at") is None]
    total = len(active)
    unread = sum(1 for n in active if not n["is_read"])

    by_category = {}
    by_priority = {}
    for n in active:
        cat = n["category"]
        pri = n["priority"]
        by_category[cat] = by_category.get(cat, 0) + 1
        by_priority[pri] = by_priority.get(pri, 0) + 1

    read_rate = round(((total - unread) / total * 100), 1) if total > 0 else 0

    return {
        "total": total,
        "unread": unread,
        "by_category": by_category,
        "by_priority": by_priority,
        "read_rate": read_rate,
    }


# ── Audit Logs ─────────────────────────────────────────────────────

@router.get("/audit")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> dict:
    """Get notification audit logs."""
    sorted_logs = sorted(_audit_logs, key=lambda x: x.get("created_at", 0), reverse=True)
    total = len(sorted_logs)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "logs": sorted_logs[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
    }