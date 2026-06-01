/**
 * Notification Center — Full-page notification management.
 * Provides comprehensive filtering, search, mark as read, archive, delete,
 * preferences, and notification statistics.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Filter,
  Inbox,
  Loader2,
  Search,
  Trash2,
  Archive,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  Users,
  ShieldAlert,
  CalendarRange,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Lock,
  Server,
  AlertTriangle,
  AlertCircle,
  Info,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications } from "@/lib/notifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { NotificationPreferences } from "../components/notifications/NotificationPreferences";
import { cn } from "@/lib/utils";
import type { NotificationCategory, NotificationFilters, NotificationPriority } from "@/types/notifications";
import { PRIORITY_CONFIG, CATEGORY_CONFIG } from "@/types/notifications";
import { notificationService } from "@/services/notifications";
import type { NotificationStats } from "@/types/notifications";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationCenter,
});

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    total,
    markAllAsRead,
    loadMore,
    refresh,
    filters,
    setFilters,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Load stats
  const loadStats = useCallback(async () => {
    const s = await notificationService.getStats();
    setStats(s);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setFilters({ ...filters, search: value || undefined, page: 1 });
    },
    [filters, setFilters]
  );

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

  const handleFilterPriority = useCallback(
    (value: string) => {
      const newFilters: NotificationFilters = { ...filters, page: 1 };
      if (value === "all") {
        delete newFilters.priority;
      } else {
        newFilters.priority = value as NotificationPriority;
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

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilters({ page: 1, page_size: 20 });
  }, [setFilters]);

  const hasActiveFilters = filters.category || filters.priority || filters.is_read !== undefined || filters.search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and review all system notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await loadStats();
              setShowStats(!showStats);
            }}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            Stats
          </Button>
          {unreadCount > 0 && (
            <Button size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Mark all read ({unreadCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Notifications</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread</CardDescription>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">{stats.unread}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Read Rate</CardDescription>
              <CardTitle className="text-2xl">{stats.read_rate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>By Priority</CardDescription>
              <div className="flex gap-1 mt-1">
                {Object.entries(stats.by_priority).map(([pri, count]) => (
                  <Badge
                    key={pri}
                    variant="outline"
                    className={cn("text-[10px]", PRIORITY_CONFIG[pri as NotificationPriority]?.color)}
                  >
                    {PRIORITY_CONFIG[pri as NotificationPriority]?.label}: {count}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={filters.category ?? "all"} onValueChange={handleFilterCategory}>
                <SelectTrigger className="h-8 w-auto text-xs">
                  <Filter className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priority ?? "all"} onValueChange={handleFilterPriority}>
                <SelectTrigger className="h-8 w-auto text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.is_read === undefined ? "all" : filters.is_read ? "read" : "unread"}
                onValueChange={handleFilterRead}
              >
                <SelectTrigger className="h-8 w-auto text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}

              <span className="ml-auto text-xs text-muted-foreground">
                {total} notification{total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <Separator />

          {/* Notification List */}
          <div className="rounded-lg border divide-y">
            {notifications.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">No notifications found</p>
                <p className="text-xs text-muted-foreground/60">
                  {hasActiveFilters ? "Try adjusting your filters" : "You're all caught up!"}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))
            )}
          </div>

          {/* Load More */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                Load more ({notifications.length} of {total})
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}