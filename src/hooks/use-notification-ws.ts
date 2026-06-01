/**
 * WebSocket hook for real-time notification delivery.
 * Falls back to polling when WebSocket is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/lib/notifications";
import type { AppNotification, NotificationWebSocketMessage } from "@/types/notifications";

const WS_URL = (import.meta as any).env?.VITE_WS_URL ?? "ws://localhost:8000/ws/notifications";
const POLL_INTERVAL = 15000; // 15 seconds
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "polling";

export function useNotificationWebSocket() {
  const { pushNotification, refreshUnreadCount, refresh } = useNotifications();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  // ── WebSocket connection ────────────────────────────────────────────

  const connect = useCallback(() => {
    try {
      // Check if WebSocket is available
      if (typeof WebSocket === "undefined") {
        setStatus("polling");
        startPolling();
        return;
      }

      setStatus("connecting");
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setStatus("connected");
        reconnectAttempts.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const message: NotificationWebSocketMessage = JSON.parse(event.data);
          handleWsMessage(message);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;
        attemptReconnect();
      };

      ws.onerror = () => {
        // Silently handle errors — onclose will fire after this
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus("polling");
      startPolling();
    }
  }, []);

  // ── Message handler ─────────────────────────────────────────────────

  const handleWsMessage = useCallback(
    (message: NotificationWebSocketMessage) => {
      switch (message.type) {
        case "notification":
          if (message.notification) {
            pushNotification(message.notification, true);
          }
          break;
        case "read_update":
          if (message.notification_id) {
            refreshUnreadCount();
          }
          break;
        case "count_update":
          if (message.unread_count !== undefined) {
            refreshUnreadCount();
          }
          break;
        case "connected":
          // Server acknowledged connection
          break;
      }
    },
    [pushNotification, refreshUnreadCount]
  );

  // ── Reconnection ────────────────────────────────────────────────────

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus("polling");
      startPolling();
      return;
    }

    reconnectTimer.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current));
  }, [connect]);

  // ── Polling fallback ────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    pollTimer.current = setInterval(() => {
      refreshUnreadCount();
    }, POLL_INTERVAL);
  }, [refreshUnreadCount]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // ── Init ────────────────────────────────────────────────────────────

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, stopPolling]);

  return {
    status,
    sendMessage,
    reconnect: connect,
  };
}