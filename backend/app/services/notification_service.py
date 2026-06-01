"""
Notification service for business logic and notification generation.

Provides:
- CRUD operations for notifications
- Template-based notification creation
- User preference management
- Delivery channel management
- Audit logging
- ML-integrated notification generation
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from app.models.notification import (
    DeliveryChannel,
    Notification,
    NotificationAuditLog,
    NotificationCategory,
    NotificationDeliveryLog,
    NotificationPreference,
    NotificationPriority,
    NotificationTemplate,
)


class NotificationService:
    """Service for managing notifications."""

    # ── Notification CRUD ──────────────────────────────────────────

    @staticmethod
    async def create_notification(
        db,
        *,
        user_id: Optional[UUID] = None,
        title: str,
        message: str,
        category: NotificationCategory,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        metadata: Optional[dict[str, Any]] = None,
        target_role: Optional[str] = None,
        target_department: Optional[str] = None,
    ) -> Notification:
        """Create a new notification."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            priority=priority,
            action_url=action_url,
            metadata_json=metadata,
            target_role=target_role,
            target_department=target_department,
        )
        db.add(notification)
        await db.flush()
        await db.refresh(notification)

        # Log creation
        await NotificationService._log_action(
            db, notification_id=notification.id, action="created"
        )

        return notification

    @staticmethod
    async def get_notifications(
        db,
        *,
        user_id: Optional[UUID] = None,
        category: Optional[NotificationCategory] = None,
        priority: Optional[NotificationPriority] = None,
        is_read: Optional[bool] = None,
        search: Optional[str] = None,
        is_archived: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """Get paginated notifications with filters."""
        from sqlalchemy import select, func, or_

        query = select(Notification).where(
            Notification.is_archived == is_archived,
            Notification.deleted_at.is_(None),
        )

        # Filter by user (include global notifications where user_id is None)
        if user_id:
            query = query.where(
                or_(
                    Notification.user_id == user_id,
                    Notification.user_id.is_(None),
                )
            )

        if category:
            query = query.where(Notification.category == category)
        if priority:
            query = query.where(Notification.priority == priority)
        if is_read is not None:
            query = query.where(Notification.is_read == is_read)
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                or_(
                    Notification.title.ilike(search_filter),
                    Notification.message.ilike(search_filter),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get unread count
        unread_query = select(func.count()).select_from(
            select(Notification).where(
                Notification.is_read == False,
                Notification.is_archived == False,
                Notification.deleted_at.is_(None),
                or_(
                    Notification.user_id == user_id,
                    Notification.user_id.is_(None),
                ) if user_id else Notification.user_id.is_(None),
            ).subquery()
        )
        unread_result = await db.execute(unread_query)
        unread_count = unread_result.scalar() or 0

        # Paginate
        query = query.order_by(Notification.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        notifications = result.scalars().all()

        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }

    @staticmethod
    async def get_unread_count(db, user_id: UUID) -> int:
        """Get the count of unread notifications for a user."""
        from sqlalchemy import select, func, or_

        query = select(func.count()).select_from(Notification).where(
            Notification.is_read == False,
            Notification.is_archived == False,
            Notification.deleted_at.is_(None),
            or_(
                Notification.user_id == user_id,
                Notification.user_id.is_(None),
            ),
        )
        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def mark_as_read(db, notification_id: UUID, user_id: UUID) -> bool:
        """Mark a notification as read."""
        from sqlalchemy import select

        query = select(Notification).where(Notification.id == notification_id)
        result = await db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            return False

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db.flush()

        await NotificationService._log_action(
            db,
            notification_id=notification_id,
            user_id=user_id,
            action="read",
        )

        return True

    @staticmethod
    async def mark_all_as_read(db, user_id: UUID) -> int:
        """Mark all notifications as read for a user. Returns count of updated."""
        from sqlalchemy import select, update, or_

        stmt = (
            update(Notification)
            .where(
                Notification.is_read == False,
                or_(
                    Notification.user_id == user_id,
                    Notification.user_id.is_(None),
                ),
            )
            .values(
                is_read=True,
                read_at=datetime.now(timezone.utc),
            )
        )
        result = await db.execute(stmt)
        count = result.rowcount
        await db.flush()

        await NotificationService._log_action(
            db, user_id=user_id, action="read_all", details={"count": count}
        )

        return count

    @staticmethod
    async def archive_notification(db, notification_id: UUID, user_id: UUID) -> bool:
        """Archive a notification."""
        from sqlalchemy import select

        query = select(Notification).where(Notification.id == notification_id)
        result = await db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            return False

        notification.is_archived = True
        await db.flush()

        await NotificationService._log_action(
            db,
            notification_id=notification_id,
            user_id=user_id,
            action="archived",
        )

        return True

    @staticmethod
    async def delete_notification(db, notification_id: UUID, user_id: UUID) -> bool:
        """Soft-delete a notification."""
        from sqlalchemy import select

        query = select(Notification).where(Notification.id == notification_id)
        result = await db.execute(query)
        notification = result.scalar_one_or_none()

        if not notification:
            return False

        notification.deleted_at = datetime.now(timezone.utc)
        await db.flush()

        await NotificationService._log_action(
            db,
            notification_id=notification_id,
            user_id=user_id,
            action="deleted",
        )

        return True

    # ── Notification Statistics ────────────────────────────────────

    @staticmethod
    async def get_stats(db, user_id: Optional[UUID] = None) -> dict:
        """Get notification statistics."""
        from sqlalchemy import select, func, or_

        base_filter = [
            Notification.is_archived == False,
            Notification.deleted_at.is_(None),
        ]
        if user_id:
            base_filter.append(
                or_(
                    Notification.user_id == user_id,
                    Notification.user_id.is_(None),
                )
            )

        # Total
        total_q = select(func.count()).select_from(Notification).where(*base_filter)
        total = (await db.execute(total_q)).scalar() or 0

        # Unread
        unread_q = select(func.count()).select_from(Notification).where(
            *base_filter, Notification.is_read == False
        )
        unread = (await db.execute(unread_q)).scalar() or 0

        # By category
        cat_q = (
            select(Notification.category, func.count())
            .where(*base_filter)
            .group_by(Notification.category)
        )
        cat_result = await db.execute(cat_q)
        by_category = {str(row[0].value if hasattr(row[0], 'value') else row[0]): row[1] for row in cat_result.all()}

        # By priority
        pri_q = (
            select(Notification.priority, func.count())
            .where(*base_filter)
            .group_by(Notification.priority)
        )
        pri_result = await db.execute(pri_q)
        by_priority = {str(row[0].value if hasattr(row[0], 'value') else row[0]): row[1] for row in pri_result.all()}

        read_rate = ((total - unread) / total * 100) if total > 0 else 0

        return {
            "total": total,
            "unread": unread,
            "by_category": by_category,
            "by_priority": by_priority,
            "read_rate": round(read_rate, 1),
        }

    # ── Templates ──────────────────────────────────────────────────

    @staticmethod
    async def create_from_template(
        db,
        template_name: str,
        user_id: Optional[UUID] = None,
        variables: Optional[dict[str, str]] = None,
        **kwargs,
    ) -> Optional[Notification]:
        """Create a notification from a template."""
        from sqlalchemy import select

        query = select(NotificationTemplate).where(
            NotificationTemplate.name == template_name,
            NotificationTemplate.is_active == True,
        )
        result = await db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            return None

        title = template.title_template
        message = template.message_template
        action_url = template.action_url_template

        if variables:
            for key, value in variables.items():
                title = title.replace(f"{{{key}}}", value)
                message = message.replace(f"{{{key}}}", value)
                if action_url:
                    action_url = action_url.replace(f"{{{key}}}", value)

        return await NotificationService.create_notification(
            db,
            user_id=user_id,
            title=title,
            message=message,
            category=template.category,
            priority=template.priority,
            action_url=action_url,
            **kwargs,
        )

    # ── Preferences ────────────────────────────────────────────────

    @staticmethod
    async def get_preferences(db, user_id: UUID) -> list[NotificationPreference]:
        """Get all notification preferences for a user."""
        from sqlalchemy import select

        query = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_preference(
        db,
        user_id: UUID,
        category: NotificationCategory,
        in_app_enabled: Optional[bool] = None,
        email_enabled: Optional[bool] = None,
        push_enabled: Optional[bool] = None,
        sms_enabled: Optional[bool] = None,
    ) -> NotificationPreference:
        """Update a notification preference for a specific category."""
        from sqlalchemy import select

        query = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id,
            NotificationPreference.category == category,
        )
        result = await db.execute(query)
        pref = result.scalar_one_or_none()

        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                category=category,
            )
            db.add(pref)

        if in_app_enabled is not None:
            pref.in_app_enabled = in_app_enabled
        if email_enabled is not None:
            pref.email_enabled = email_enabled
        if push_enabled is not None:
            pref.push_enabled = push_enabled
        if sms_enabled is not None:
            pref.sms_enabled = sms_enabled

        await db.flush()
        await db.refresh(pref)
        return pref

    @staticmethod
    async def update_all_preferences(
        db,
        user_id: UUID,
        updates: dict[NotificationCategory, dict[str, bool]],
    ) -> list[NotificationPreference]:
        """Bulk update notification preferences."""
        results = []
        for category, channel_updates in updates.items():
            pref = await NotificationService.update_preference(
                db,
                user_id=user_id,
                category=category,
                **channel_updates,
            )
            results.append(pref)
        return results

    # ── Audit Logging ──────────────────────────────────────────────

    @staticmethod
    async def _log_action(
        db,
        *,
        notification_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        action: str,
        details: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ):
        """Log a notification action for audit purposes."""
        log_entry = NotificationAuditLog(
            notification_id=notification_id,
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
        )
        db.add(log_entry)
        await db.flush()

    @staticmethod
    async def get_audit_logs(
        db,
        user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Get notification audit logs."""
        from sqlalchemy import select, func

        query = select(NotificationAuditLog)
        if user_id:
            query = query.where(NotificationAuditLog.user_id == user_id)

        count_q = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_q)).scalar() or 0

        query = query.order_by(NotificationAuditLog.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        logs = result.scalars().all()

        return {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    # ── Delivery Logs ──────────────────────────────────────────────

    @staticmethod
    async def log_delivery(
        db,
        *,
        notification_id: UUID,
        channel: DeliveryChannel,
        status: str = "pending",
    ) -> NotificationDeliveryLog:
        """Log a delivery attempt."""
        log = NotificationDeliveryLog(
            notification_id=notification_id,
            channel=channel,
            status=status,
            attempts=1,
            last_attempt_at=datetime.now(timezone.utc),
        )
        db.add(log)
        await db.flush()
        return log