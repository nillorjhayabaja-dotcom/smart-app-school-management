/**
 * Notification Service — API layer for notification operations.
 * Uses mock data in development; swap for apiRequest() when backend is live.
 */

import type {
  AppNotification,
  NotificationCategory,
  NotificationFilters,
  NotificationListResponse,
  NotificationPreference,
  NotificationStats,
  NotificationPriority,
} from "@/types/notifications";

const delay = <T>(d: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(d), ms));

// ── Mock Data ────────────────────────────────────────────────────────

const _now = Date.now();

const seedNotifications: AppNotification[] = [
  {
    id: "n-1",
    user_id: null,
    title: "Workforce Imbalance Detected",
    message: "Mathematics department requires 2 additional teachers based on projected enrollment growth of 14%.",
    category: "workforce",
    priority: "HIGH",
    action_url: "/app/allocation",
    metadata: { department: "Mathematics", deficit: 2 },
    target_role: "hr_admin",
    target_department: "Mathematics",
    is_read: false,
    is_archived: false,
    created_at: _now - 3600000,
  },
  {
    id: "n-2",
    user_id: null,
    title: "High Burnout Risk Alert",
    message: "Teacher Maria Santos has a burnout probability of 89%. Immediate intervention recommended.",
    category: "risk",
    priority: "CRITICAL",
    action_url: "/app/risk",
    metadata: { teacher_name: "Maria Santos", burnout_score: 89 },
    is_read: false,
    is_archived: false,
    created_at: _now - 1800000,
  },
  {
    id: "n-3",
    user_id: null,
    title: "Enrollment Growth Forecast",
    message: "Projected STEM enrollment increased by 14% next school year. Prepare infrastructure and staffing accordingly.",
    category: "enrollment",
    priority: "MEDIUM",
    action_url: "/app/predictive",
    metadata: { growth_percentage: 14, strand: "STEM" },
    target_role: "department_head",
    target_department: "Sciences",
    is_read: false,
    is_archived: false,
    created_at: _now - 7200000,
  },
  {
    id: "n-4",
    user_id: null,
    title: "Schedule Conflict Detected",
    message: "Schedule conflict found for Teacher Cruz on Tuesday at 10:00 AM. Two classes assigned to R-104.",
    category: "scheduling",
    priority: "HIGH",
    action_url: "/app/scheduling",
    metadata: { teacher_name: "Cruz", day: "Tuesday", time: "10:00", room: "R-104" },
    is_read: true,
    read_at: _now - 3000000,
    is_archived: false,
    created_at: _now - 10800000,
  },
  {
    id: "n-5",
    user_id: null,
    title: "ML Recommendation: Hire STEM Teachers",
    message: "Based on enrollment forecasts and current workload analysis, hiring 3 additional STEM teachers is recommended.",
    category: "recommendation",
    priority: "HIGH",
    action_url: "/app/recommendations",
    metadata: { recommendation_type: "hiring", count: 3, department: "STEM" },
    is_read: false,
    is_archived: false,
    created_at: _now - 5400000,
  },
  {
    id: "n-6",
    user_id: null,
    title: "Performance Improvement Detected",
    message: "Teacher performance improved by 12% this quarter. Training program effectiveness confirmed.",
    category: "performance",
    priority: "MEDIUM",
    action_url: "/app/employees",
    metadata: { improvement: 12, period: "Q3" },
    is_read: true,
    read_at: _now - 4000000,
    is_archived: false,
    created_at: _now - 14400000,
  },
  {
    id: "n-7",
    user_id: null,
    title: "Certification Expiring Soon",
    message: "Teacher certification expires in 30 days. Please ensure renewal is initiated.",
    category: "performance",
    priority: "MEDIUM",
    action_url: "/app/employees",
    metadata: { days_remaining: 30 },
    is_read: false,
    is_archived: false,
    created_at: _now - 21600000,
  },
  {
    id: "n-8",
    user_id: null,
    title: "ARIMA Model Retrained",
    message: "Enrollment forecasting ARIMA model has been successfully retrained with latest data.",
    category: "system",
    priority: "LOW",
    action_url: null,
    metadata: { model: "ARIMA", accuracy: "94.2%" },
    is_read: true,
    read_at: _now - 9000000,
    is_archived: false,
    created_at: _now - 28800000,
  },
  {
    id: "n-9",
    user_id: null,
    title: "Failed Login Attempts Detected",
    message: "5 failed login attempts detected for account admin@school.edu. Account may be compromised.",
    category: "security",
    priority: "CRITICAL",
    action_url: "/app/audit",
    metadata: { attempts: 5, account: "admin@school.edu" },
    is_read: false,
    is_archived: false,
    created_at: _now - 600000,
  },
  {
    id: "n-10",
    user_id: null,
    title: "Database Backup Completed",
    message: "Scheduled database backup completed successfully. Size: 2.4 GB.",
    category: "system",
    priority: "LOW",
    action_url: null,
    metadata: { backup_size: "2.4 GB", status: "success" },
    is_read: true,
    read_at: _now - 50000000,
    is_archived: false,
    created_at: _now - 43200000,
  },
  {
    id: "n-11",
    user_id: null,
    title: "Teacher Retention Risk Increased",
    message: "Teacher retention probability dropped below 50% for 3 teachers in the Sciences department.",
    category: "risk",
    priority: "HIGH",
    action_url: "/app/risk",
    metadata: { affected_teachers: 3, department: "Sciences", retention_probability: 47 },
    is_read: false,
    is_archived: false,
    created_at: _now - 900000,
  },
  {
    id: "n-12",
    user_id: null,
    title: "Recommendation: Reassign ICT Classes",
    message: "Reassigning ICT classes to underutilized teachers could improve workforce utilization by 18%.",
    category: "recommendation",
    priority: "MEDIUM",
    action_url: "/app/recommendations",
    metadata: { utilization_improvement: 18, action: "reassign" },
    is_read: false,
    is_archived: false,
    created_at: _now - 3600000,
  },
  {
    id: "n-13",
    user_id: null,
    title: "Teacher Workload Exceeds Threshold",
    message: "Teacher Garcia workload exceeds 100% threshold. Current utilization at 112%.",
    category: "workforce",
    priority: "CRITICAL",
    action_url: "/app/workload",
    metadata: { teacher_name: "Garcia", utilization: 112 },
    is_read: false,
    is_archived: false,
    created_at: _now - 1200000,
  },
  {
    id: "n-14",
    user_id: null,
    title: "Student Growth Exceeds Capacity",
    message: "Projected student growth will exceed current classroom capacity by 15% within 18 months.",
    category: "enrollment",
    priority: "HIGH",
    action_url: "/app/predictive",
    metadata: { excess_percentage: 15, timeframe_months: 18 },
    is_read: false,
    is_archived: false,
    created_at: _now - 6000000,
  },
  {
    id: "n-15",
    user_id: null,
    title: "User Role Changed",
    message: "User role changed from Viewer to HR Admin for account hr-admin@school.edu.",
    category: "security",
    priority: "MEDIUM",
    action_url: "/app/audit",
    metadata: { account: "hr-admin@school.edu", old_role: "viewer", new_role: "hr_admin" },
    is_read: true,
    read_at: _now - 30000000,
    is_archived: false,
    created_at: _now - 36000000,
  },
];

// ── In-memory state ──────────────────────────────────────────────────

let _notifications: AppNotification[] = [...seedNotifications];
let _listeners: Array<() => void> = [];

function notify() {
  _listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}

// ── Service ──────────────────────────────────────────────────────────

export const notificationService = {
  /** Get paginated notifications with optional filters */
  async list(filters?: NotificationFilters): Promise<NotificationListResponse> {
    let filtered = _notifications.filter((n) => !n.is_archived);

    if (filters?.category) {
      filtered = filtered.filter((n) => n.category === filters.category);
    }
    if (filters?.priority) {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }
    if (filters?.is_read !== undefined) {
      filtered = filtered.filter((n) => n.is_read === filters.is_read);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
      );
    }

    // Sort by created_at descending
    filtered.sort((a, b) => {
      const ta = typeof a.created_at === "number" ? a.created_at : new Date(a.created_at).getTime();
      const tb = typeof b.created_at === "number" ? b.created_at : new Date(b.created_at).getTime();
      return tb - ta;
    });

    const total = filtered.length;
    const unread_count = filtered.filter((n) => !n.is_read).length;
    const page = filters?.page ?? 1;
    const page_size = filters?.page_size ?? 20;
    const start = (page - 1) * page_size;
    const paginated = filtered.slice(start, start + page_size);

    return delay({
      notifications: paginated,
      total,
      unread_count,
      page,
      page_size,
      has_more: start + page_size < total,
    });
  },

  /** Get unread notification count */
  async getUnreadCount(): Promise<number> {
    const count = _notifications.filter((n) => !n.is_read && !n.is_archived).length;
    return delay(count, 100);
  },

  /** Mark specific notifications as read */
  async markAsRead(ids: string[]): Promise<{ updated: number }> {
    let updated = 0;
    _notifications = _notifications.map((n) => {
      if (ids.includes(n.id) && !n.is_read) {
        updated++;
        return { ...n, is_read: true, read_at: Date.now() };
      }
      return n;
    });
    notify();
    return delay({ updated });
  },

  /** Mark all notifications as read */
  async markAllAsRead(): Promise<{ updated: number }> {
    let updated = 0;
    _notifications = _notifications.map((n) => {
      if (!n.is_read && !n.is_archived) {
        updated++;
        return { ...n, is_read: true, read_at: Date.now() };
      }
      return n;
    });
    notify();
    return delay({ updated });
  },

  /** Archive a notification */
  async archive(id: string): Promise<boolean> {
    const idx = _notifications.findIndex((n) => n.id === id);
    if (idx >= 0) {
      _notifications[idx] = { ..._notifications[idx], is_archived: true };
      notify();
      return delay(true);
    }
    return delay(false);
  },

  /** Delete a notification (soft-delete) */
  async delete(id: string): Promise<boolean> {
    _notifications = _notifications.filter((n) => n.id !== id);
    notify();
    return delay(true);
  },

  /** Create a notification (for ML/system use) */
  async create(
    n: Omit<AppNotification, "id" | "is_read" | "is_archived" | "created_at">
  ): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...n,
      id: `n-${crypto.randomUUID().slice(0, 8)}`,
      is_read: false,
      is_archived: false,
      created_at: Date.now(),
    };
    _notifications = [newNotif, ..._notifications];
    notify();
    return delay(newNotif);
  },

  /** Get notification statistics */
  async getStats(): Promise<NotificationStats> {
    const active = _notifications.filter((n) => !n.is_archived);
    const total = active.length;
    const unread = active.filter((n) => !n.is_read).length;

    const by_category: Record<string, number> = {};
    const by_priority: Record<string, number> = {};
    active.forEach((n) => {
      by_category[n.category] = (by_category[n.category] || 0) + 1;
      by_priority[n.priority] = (by_priority[n.priority] || 0) + 1;
    });

    return delay({
      total,
      unread,
      by_category: by_category as Record<NotificationCategory, number>,
      by_priority: by_priority as Record<NotificationPriority, number>,
      read_rate: total > 0 ? Math.round(((total - unread) / total) * 100 * 10) / 10 : 0,
    });
  },

  /** Get notification preferences */
  async getPreferences(): Promise<NotificationPreference[]> {
    const categories: NotificationCategory[] = [
      "workforce", "risk", "scheduling", "enrollment",
      "recommendation", "performance", "security", "system",
    ];
    return delay(
      categories.map((cat) => ({
        id: `pref-${cat}`,
        user_id: "current-user",
        category: cat,
        in_app_enabled: true,
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
      }))
    );
  },

  /** Update notification preferences */
  async updatePreferences(
    category: NotificationCategory,
    updates: Partial<Pick<NotificationPreference, "in_app_enabled" | "email_enabled" | "push_enabled" | "sms_enabled">>
  ): Promise<NotificationPreference> {
    return delay({
      id: `pref-${category}`,
      user_id: "current-user",
      category,
      in_app_enabled: updates.in_app_enabled ?? true,
      email_enabled: updates.email_enabled ?? true,
      push_enabled: updates.push_enabled ?? true,
      sms_enabled: updates.sms_enabled ?? false,
    });
  },

  /** Subscribe to notification changes */
  subscribe,

  /** Get all raw notifications (for context) */
  getAll: () => [..._notifications],
};