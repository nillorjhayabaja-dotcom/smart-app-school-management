/**
 * NotificationDropdown — Shows recent notifications in a compact list.
 * Used inside the Popover triggered by the NotificationBell.
 */

import { useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Filter,
  Inbox,
  Loader2,
  Trash2,
  Archive,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/lib/notifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NotificationCategory, NotificationFilters, NotificationPriority } from "@/types/notifications";

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    total,
    markAllAsRead,
    loadMore,
    filters,
    setFilters,
  } = useNotifications();

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFilterCategory = useCallback(
    (value: string) => {
      const newFilters: NotificationFilters = { ...filters, page: 1 };
      if (value === "all") {
        delete newFilters.category;
      } else {
        newFilters.category = value as NotificationCategory;
      }
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  const handleFilterRead = useCallback(
    (value: string) => {
      const newFilters: NotificationFilters = { ...filters, page: 1 };
      if (value === "all") {
        delete newFilters.is_read;
      } else {
        newFilters.is_read = value === "unread";
      }
      setFilters(newFilters);
    },
    [filters, setFilters]
  );

  const handleViewAll = useCallback(() => {
    navigate({ to: "/app/notifications" });
  }, [navigate]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Read all
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <Select
          value={filters.category ?? "all"}
          onValueChange={handleFilterCategory}
        >
          <SelectTrigger className="h-7 w-auto text-xs">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="workforce">Workforce</SelectItem>
            <SelectItem value="risk">Risk</SelectItem>
            <SelectItem value="scheduling">Scheduling</SelectItem>
            <SelectItem value="enrollment">Enrollment</SelectItem>
            <SelectItem value="recommendation">Recommendation</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.is_read === undefined ? "all" : filters.is_read ? "read" : "unread"}
          onValueChange={handleFilterRead}
        >
          <SelectTrigger className="h-7 w-auto text-xs">
            <Eye className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Notification List */}
      <ScrollArea className="max-h-[400px]">
        <div ref={scrollRef} className="divide-y">
          {notifications.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/60">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && hasMore && (
            <button
              onClick={loadMore}
              className="flex w-full items-center justify-center py-3 text-xs text-primary hover:bg-accent"
            >
              Load more ({notifications.length} of {total})
            </button>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-center px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="w-full text-xs"
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          View Notification Center
        </Button>
      </div>
    </div>
  );
}