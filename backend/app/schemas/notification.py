"""
Pydantic schemas for notification API endpoints.

Request/response models for:
- Creating notifications
- Listing notifications
- Updating read status
- Notification preferences
- Delivery logs
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.notification import (
    DeliveryChannel,
    NotificationCategory,
    NotificationPriority,
)


# ── Notification Schemas ──────────────────────────────────────────────

class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: Optional[UUID] = None  # null = global notification
    title: str = Field(..., max_length=255)
    message: str
    category: NotificationCategory
    priority: NotificationPriority = NotificationPriority.MEDIUM
    action_url: Optional[str] = Field(None, max_length=500)
    metadata: Optional[dict[str, Any]] = None
    target_role: Optional[str] = Field(None, max_length=50)
    target_department: Optional[str] = Field(None, max_length=100)


class NotificationBulkCreate(BaseModel):
    """Schema for creating notifications for multiple users."""
    user_ids: list[UUID]
    title: str = Field(..., max_length=255)
    message: str
    category: NotificationCategory
    priority: NotificationPriority = NotificationPriority.MEDIUM
    action_url: Optional[str] = Field(None, max_length=500)
    metadata: Optional[dict[str, Any]] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: UUID
    user_id: Optional[UUID] = None
    title: str
    message: str
    category: NotificationCategory
    priority: NotificationPriority
    action_url: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    target_role: Optional[str] = None
    target_department: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    is_archived: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Paginated notification list response."""
    notifications: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int
    has_more: bool


class NotificationReadRequest(BaseModel):
    """Schema for marking notifications as read."""
    notification_ids: list[UUID]


class NotificationFilterParams(BaseModel):
    """Query parameters for filtering notifications."""
    category: Optional[NotificationCategory] = None
    priority: Optional[NotificationPriority] = None
    is_read: Optional[bool] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 20


# ── Notification Template Schemas ─────────────────────────────────────

class NotificationTemplateCreate(BaseModel):
    """Schema for creating a notification template."""
    name: str = Field(..., max_length=100)
    category: NotificationCategory
    priority: NotificationPriority = NotificationPriority.MEDIUM
    title_template: str = Field(..., max_length=255)
    message_template: str
    action_url_template: Optional[str] = Field(None, max_length=500)


class NotificationTemplateResponse(BaseModel):
    """Schema for notification template response."""
    id: UUID
    name: str
    category: NotificationCategory
    priority: NotificationPriority
    title_template: str
    message_template: str
    action_url_template: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notification Preference Schemas ───────────────────────────────────

class NotificationPreferenceUpdate(BaseModel):
    """Schema for updating notification preferences."""
    in_app_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None


class NotificationPreferenceResponse(BaseModel):
    """Schema for notification preference response."""
    id: UUID
    user_id: UUID
    category: NotificationCategory
    in_app_enabled: bool
    email_enabled: bool
    push_enabled: bool
    sms_enabled: bool

    class Config:
        from_attributes = True


class NotificationPreferenceBulkUpdate(BaseModel):
    """Schema for bulk updating notification preferences."""
    preferences: dict[NotificationCategory, NotificationPreferenceUpdate]


# ── Notification Delivery Log Schemas ─────────────────────────────────

class NotificationDeliveryLogResponse(BaseModel):
    """Schema for notification delivery log response."""
    id: UUID
    notification_id: UUID
    channel: DeliveryChannel
    status: str
    attempts: int
    last_attempt_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Notification Audit Log Schemas ────────────────────────────────────

class NotificationAuditLogResponse(BaseModel):
    """Schema for notification audit log response."""
    id: UUID
    notification_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    action: str
    details: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── WebSocket Message Schemas ─────────────────────────────────────────

class NotificationWebSocketMessage(BaseModel):
    """Schema for real-time WebSocket notification messages."""
    type: str = "notification"  # notification, read_update, count_update
    notification: Optional[NotificationResponse] = None
    unread_count: Optional[int] = None
    notification_id: Optional[UUID] = None


# ── Notification Statistics ───────────────────────────────────────────

class NotificationStats(BaseModel):
    """Notification statistics for dashboard."""
    total: int
    unread: int
    by_category: dict[str, int]
    by_priority: dict[str, int]
    read_rate: float  # percentage of read notifications