import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { ScrollText, Search, Filter, User, Calendar, Globe, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditLogEntry } from "@/types/reports";

interface AuditViewProps {
  data: AuditLogEntry[];
  loading: boolean;
}

const actionColors: Record<string, string> = {
  report_generated: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  report_exported: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  user_login: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  user_logout: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  employee_updated: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  employee_created: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  settings_changed: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  report_viewed: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  default: "bg-muted text-muted-foreground",
};

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditView({ data, loading }: AuditViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const actors = useMemo(() => [...new Set(data.map((d) => d.actor))], [data]);
  const actions = useMemo(() => [...new Set(data.map((d) => d.action))], [data]);

  const filtered = useMemo(() => {
    return data.filter((entry) => {
      if (searchQuery && !entry.actor.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !entry.target.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !entry.details.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (actorFilter !== "all" && entry.actor !== actorFilter) return false;
      return true;
    });
  }, [data, searchQuery, actionFilter, actorFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {data.length} audit entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{formatAction(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <User className="mr-1 h-3 w-3" />
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Audit Trail
          </CardTitle>
          <CardDescription>User activity and system changes log</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left bg-muted/50">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">User</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Action</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Target</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Details</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-[10px] uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium">{entry.actor}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-normal ${actionColors[entry.action] || actionColors.default}`}
                      >
                        {formatAction(entry.action)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{entry.target}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate" title={entry.details}>
                      {entry.details}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
                      {new Date(entry.at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ScrollText className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No audit entries match your filters</p>
            </div>
          )}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-3 border-t">
              Showing 50 of {filtered.length} entries. Use filters to narrow results.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}