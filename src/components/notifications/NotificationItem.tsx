/**
 * NotificationItem — Individual notification row.
 * Shows priority dot, category icon, title, message, timestamp, and actions.
 */

import { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Users,
  ShieldAlert,
  CalendarRange,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Lock,
  Server,
  Check,
  Archive,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications } from "@/lib/notifications";
import type {
  AppNotification,
  NotificationCategory,
  NotificationPriority,
} from "@/types/notifications";
import { PRIORITY_CONFIG, CATEGORY_CONFIG } from "@/types/notifications";

// ── Category Icon Map ─────────────────────────────────────────────────

const categoryIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  workforce: Users,
  risk: ShieldAlert,
  scheduling: CalendarRange,
  enrollment: GraduationCap,
  recommendation: Sparkles,
  performance: TrendingUp,
  security: Lock,
  system: Server,
};

// ── Relative Time ─────────────────────────────────────────────────────

function timeAgo(timestamp: number | string): string {
  const now = Date.now();
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  const seconds = Math.floor((now - ts) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Component ─────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: AppNotification;
  compact?: boolean;
}

export function NotificationItem({ notification, compact = false }: NotificationItemProps) {
  const { markAsRead, archive, remove } = useNotifications();
  const navigate = useNavigate();

  const priorityConfig = PRIORITY_CONFIG[notification.priority];
  const categoryConfig = CATEGORY_CONFIG[notification.category];
  const CategoryIcon = categoryIcons[notification.category];

  const handleClick = useCallback(() => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate({ to: notification.action_url as any });
    }
  }, [notification, markAsRead, navigate]);

  const handleMarkRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      markAsRead(notification.id);
    },
    [notification.id, markAsRead]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      archive(notification.id);
    },
    [notification.id, archive]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      remove(notification.id);
    },
    [notification.id, remove]
  );

  const timestamp = useMemo(
    () => timeAgo(notification.created_at),
    [notification.created_at]
  );

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors cursor-pointer",
        "hover:bg-accent/50",
        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20",
        compact && "py-2"
      )}
    >
      {/* Priority Dot */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            priorityConfig.dotColor,
            notification.priority === "CRITICAL" && "animate-pulse"
          )}
        />
        {!compact && (
          <CategoryIcon
            className={cn("h-4 w-4", categoryConfig.color)}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              notification.is_read
                ? "font-normal text-muted-foreground"
                : "font-medium"
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {timestamp}
          </span>
        </div>
        <p className={cn(
          "mt-0.5 text-xs leading-relaxed text-muted-foreground",
          compact && "line-clamp-1"
        )}>
          {notification.message}
        </p>

        {/* Tags */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              priorityConfig.bgColor,
              priorityConfig.color,
              "border",
              priorityConfig.borderColor
            )}
          >
            {priorityConfig.label}
          </span>
          <span className={cn("text-[10px] font-medium", categoryConfig.color)}>
            {categoryConfig.label}
          </span>
          {notification.target_department && (
            <span className="text-[10px] text-muted-foreground">
              · {notification.target_department}
            </span>
          )}
        </div>
      </div>

      {/* Actions (shown on hover) */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMarkRead}
              >
                <Check className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark as read</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleArchive}
            >
              <Archive className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}