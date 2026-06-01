"""
WebSocket manager for real-time notification delivery.

Provides:
- WebSocket connection management
- Broadcast notifications to connected clients
- Per-user notification channels
- Connection lifecycle management
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications."""

    def __init__(self):
        # user_id -> list of WebSocket connections
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if user_id not in self._connections:
                self._connections[user_id] = []
            self._connections[user_id].append(websocket)

        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to notification service",
        })

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection."""
        async with self._lock:
            if user_id in self._connections:
                self._connections[user_id] = [
                    ws for ws in self._connections[user_id] if ws != websocket
                ]
                if not self._connections[user_id]:
                    del self._connections[user_id]

    async def send_to_user(self, user_id: str, message: dict[str, Any]):
        """Send a notification to a specific user."""
        async with self._lock:
            connections = self._connections.get(user_id, []).copy()

        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                if user_id in self._connections:
                    self._connections[user_id] = [
                        ws for ws in self._connections[user_id]
                        if ws not in disconnected
                    ]

    async def broadcast(self, message: dict[str, Any]):
        """Broadcast a message to all connected clients."""
        async with self._lock:
            all_connections = {
                uid: conns.copy() for uid, conns in self._connections.items()
            }

        for user_id, connections in all_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    async def send_notification(self, notification: dict[str, Any]):
        """Send a notification via WebSocket to appropriate users."""
        target_role = notification.get("target_role")
        target_department = notification.get("target_department")
        user_id = notification.get("user_id")

        message = {
            "type": "notification",
            "notification": notification,
        }

        if user_id:
            # Send to specific user
            await self.send_to_user(str(user_id), message)
        else:
            # Broadcast to all connected clients (global notification)
            await self.broadcast(message)

    async def notify_read_update(self, user_id: str, notification_id: str):
        """Notify about a read status change."""
        await self.send_to_user(user_id, {
            "type": "read_update",
            "notification_id": notification_id,
        })

    async def notify_count_update(self, user_id: str, unread_count: int):
        """Send an unread count update."""
        await self.send_to_user(user_id, {
            "type": "count_update",
            "unread_count": unread_count,
        })

    @property
    def connected_users(self) -> list[str]:
        """Get list of connected user IDs."""
        return list(self._connections.keys())

    @property
    def total_connections(self) -> int:
        """Get total number of active connections."""
        return sum(len(conns) for conns in self._connections.values())


# Global connection manager instance
notification_manager = ConnectionManager()


# ── WebSocket Endpoint ──────────────────────────────────────────────

@router.websocket("/ws/notifications")
async def notification_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time notifications.
    
    Clients connect here to receive real-time notifications.
    Expects authentication via query parameter or token.
    """
    # Get user_id from query params (in production, verify JWT token)
    user_id = websocket.query_params.get("user_id", "anonymous")

    await notification_manager.connect(websocket, user_id)

    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                # Handle ping/pong for keepalive
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

                # Handle mark as read via WebSocket
                elif message.get("type") == "mark_read":
                    notification_id = message.get("notification_id")
                    if notification_id:
                        # In production, call notification service
                        await notification_manager.notify_read_update(
                            user_id, notification_id
                        )

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        await notification_manager.disconnect(websocket, user_id)


# ── REST endpoint for WS status ────────────────────────────────────

@router.get("/ws/status")
async def ws_status() -> dict:
    """Get WebSocket connection status."""
    return {
        "connected_users": notification_manager.connected_users,
        "total_connections": notification_manager.total_connections,
    }