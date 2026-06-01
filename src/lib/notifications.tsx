/**
 * Enterprise Notification Context & Provider
 * Central state management for the notification system.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { notificationService } from "@/services/notifications";
import type {
  AppNotification,
  NotificationCategory,
  NotificationFilters,
  NotificationListResponse,
  NotificationPriority,
} from "@/types/notifications";

// ── Context Type ──────────────────────────────────────────────────────

interface NotificationContextType {
  // State
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  total: number;

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  pushNotification: (
    n: Omit<AppNotification, "id" | "is_read" | "is_archived" | "created_at">,
    showToast?: boolean
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archive: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  // Filters
  setFilters: (filters: NotificationFilters) => void;
  filters: NotificationFilters;

  // Refresh
  refresh: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, page_size: 20 });
  const currentPageRef = useRef(1);

  // ── Fetch notifications ────────────────────────────────────────────

  const fetchNotifications = useCallback(async (newFilters?: NotificationFilters) => {
    setIsLoading(true);
    try {
      const f = newFilters ?? filters;
      currentPageRef.current = f.page ?? 1;
      const response: NotificationListResponse = await notificationService.list(f);
      if (currentPageRef.current === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications((prev) => [...prev, ...response.notifications]);
      }
      setTotal(response.total);
      setHasMore(response.has_more);
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = currentPageRef.current + 1;
    const newFilters = { ...filters, page: nextPage };
    await fetchNotifications(newFilters);
  }, [isLoading, hasMore, filters, fetchNotifications]);

  // ── Refresh ────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    currentPageRef.current = 1;
    const f = { ...filters, page: 1 };
    await fetchNotifications(f);
  }, [filters, fetchNotifications]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  // ── Push notification ──────────────────────────────────────────────

  const pushNotification = useCallback(
    async (
      n: Omit<AppNotification, "id" | "is_read" | "is_archived" | "created_at">,
      showToast = true
    ) => {
      const created = await notificationService.create(n);
      setNotifications((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      setUnreadCount((prev) => prev + 1);

      if (showToast) {
        const priorityLabels: Record<NotificationPriority, string> = {
          CRITICAL: "🔴 Critical",
          HIGH: "🟠 High",
          MEDIUM: "🔵 Medium",
          LOW: "⚪ Low",
        };
        toast(created.title, {
          description: created.message,
          duration: created.priority === "CRITICAL" ? 10000 : 5000,
        });
      }
    },
    []
  );

  // ── Mark as read ───────────────────────────────────────────────────

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead([id]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: Date.now() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: Date.now() }))
    );
    setUnreadCount(0);
  }, []);

  // ── Archive ────────────────────────────────────────────────────────

  const archive = useCallback(async (id: string) => {
    await notificationService.archive(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  // ── Remove ─────────────────────────────────────────────────────────

  const remove = useCallback(async (id: string) => {
    await notificationService.delete(id);
    const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => prev - 1);
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
  }, [notifications]);

  // ── Filter change ──────────────────────────────────────────────────

  const handleSetFilters = useCallback(
    (newFilters: NotificationFilters) => {
      setFilters(newFilters);
      currentPageRef.current = 1;
      // Auto-fetch when filters change
      (async () => {
        setIsLoading(true);
        try {
          const response = await notificationService.list({ ...newFilters, page: 1, page_size: 20 });
          setNotifications(response.notifications);
          setTotal(response.total);
          setHasMore(response.has_more);
          setUnreadCount(response.unread_count);
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        } finally {
          setIsLoading(false);
        }
      })();
    },
    []
  );

  // ── Initial fetch ──────────────────────────────────────────────────

  useEffect(() => {
    fetchNotifications({ page: 1, page_size: 20 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic unread count refresh ──────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // ── Value ──────────────────────────────────────────────────────────

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      hasMore,
      total,
      fetchNotifications,
      loadMore,
      pushNotification,
      markAsRead,
      markAllAsRead,
      archive,
      remove,
      setFilters: handleSetFilters,
      filters,
      refresh,
      refreshUnreadCount,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      hasMore,
      total,
      fetchNotifications,
      loadMore,
      pushNotification,
      markAsRead,
      markAllAsRead,
      archive,
      remove,
      handleSetFilters,
      filters,
      refresh,
      refreshUnreadCount,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
}