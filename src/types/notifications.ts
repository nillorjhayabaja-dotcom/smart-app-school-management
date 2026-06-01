/**
 * Enterprise Notification System Types
 * Complete type definitions for the notification system.
 */

// ── Core Notification Types ──────────────────────────────────────────

export type NotificationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type NotificationCategory =
  | "workforce"
  | "risk"
  | "scheduling"
  | "enrollment"
  | "recommendation"
  | "performance"
  | "security"
  | "system";

export type DeliveryChannel = "in_app" | "email" | "push" | "sms";

export type NotificationAction =
  | "created"
  | "read"
  | "archived"
  | "deleted"
  | "delivery_initiated"
  | "delivery_completed"
  | "delivery_failed"
  | "read_all";

export type TargetRole = "super_admin" | "hr_admin" | "department_head" | "viewer";

// ── Notification Interface ───────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  action_url?: string | null;
  metadata?: Record<string, any> | null;
  target_role?: string | null;
  target_department?: string | null;
  is_read: boolean;
  read_at?: number | string | null;
  is_archived: boolean;
  created_at: number | string;
}

// ── Notification Template ────────────────────────────────────────────

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title_template: string;
  message_template: string;
  action_url_template?: string;
  is_active: boolean;
  created_at: string;
}

// ── Notification Preferences ─────────────────────────────────────────

export interface NotificationPreference {
  id: string;
  user_id: string;
  category: NotificationCategory;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
}

// ── Notification Delivery Log ────────────────────────────────────────

export interface NotificationDeliveryLog {
  id: string;
  notification_id: string;
  channel: DeliveryChannel;
  status: "pending" | "sent" | "delivered" | "failed";
  attempts: number;
  last_attempt_at?: string;
  delivered_at?: string;
  error_message?: string;
  created_at: string;
}

// ── Notification Audit Log ───────────────────────────────────────────

export interface NotificationAuditLog {
  id: string;
  notification_id?: string;
  user_id?: string;
  action: NotificationAction;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// ── API Response Types ───────────────────────────────────────────────

export interface NotificationListResponse {
  notifications: AppNotification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
  read_rate: number;
}

export interface NotificationAuditLogsResponse {
  logs: NotificationAuditLog[];
  total: number;
  page: number;
  page_size: number;
}

// ── WebSocket Message Types ──────────────────────────────────────────

export interface NotificationWebSocketMessage {
  type: "notification" | "read_update" | "count_update" | "connected";
  notification?: AppNotification;
  unread_count?: number;
  notification_id?: string;
  message?: string;
}

// ── Filter & Query Types ─────────────────────────────────────────────

export interface NotificationFilters {
  category?: NotificationCategory;
  priority?: NotificationPriority;
  is_read?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// ── Priority & Category Metadata ─────────────────────────────────────

export const PRIORITY_CONFIG: Record<
  NotificationPriority,
  { label: string; color: string; bgColor: string; borderColor: string; dotColor: string }
> = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/50",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
  },
  HIGH: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
    borderColor: "border-orange-200 dark:border-orange-800",
    dotColor: "bg-orange-500",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
  },
  LOW: {
    label: "Low",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/50",
    borderColor: "border-gray-200 dark:border-gray-800",
    dotColor: "bg-gray-400",
  },
};

export const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; icon: string; color: string }
> = {
  workforce: { label: "Workforce", icon: "Users", color: "text-indigo-600 dark:text-indigo-400" },
  risk: { label: "Risk", icon: "ShieldAlert", color: "text-red-600 dark:text-red-400" },
  scheduling: { label: "Scheduling", icon: "CalendarRange", color: "text-cyan-600 dark:text-cyan-400" },
  enrollment: { label: "Enrollment", icon: "GraduationCap", color: "text-violet-600 dark:text-violet-400" },
  recommendation: { label: "Recommendation", icon: "Sparkles", color: "text-amber-600 dark:text-amber-400" },
  performance: { label: "Performance", icon: "TrendingUp", color: "text-emerald-600 dark:text-emerald-400" },
  security: { label: "Security", icon: "Lock", color: "text-rose-600 dark:text-rose-400" },
  system: { label: "System", icon: "Server", color: "text-slate-600 dark:text-slate-400" },
};