import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { CalendarRange, Clock, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import type { ScheduleEfficiencyRow } from "@/types/reports";

interface SchedulingEfficiencyViewProps {
  data: ScheduleEfficiencyRow[];
  loading: boolean;
}

export function SchedulingEfficiencyView({ data, loading }: SchedulingEfficiencyViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  const totalConflicts = data.reduce((s, d) => s + d.conflicts, 0);
  const totalOvertime = data.reduce((s, d) => s + d.overtime, 0);
  const avgUtilization = data.length ? Math.round(data.reduce((s, d) => s + d.utilization, 0) / data.length) : 0;
  const conflictTeachers = data.filter((d) => d.conflicts > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Schedule Conflicts
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">{totalConflicts}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {conflictTeachers} teachers affected
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Overtime Hours
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">{totalOvertime}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total overtime hours this period
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-emerald-500" /> Avg Utilization
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">{avgUtilization}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Target: 80-90%
          </CardContent>
        </Card>
      </div>

      {/* Schedule Efficiency Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schedule Utilization & Conflict Analysis</CardTitle>
          <CardDescription>Teacher scheduling efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Teacher</th>
                  <th className="pb-2 font-medium text-muted-foreground">Department</th>
                  <th className="pb-2 font-medium text-muted-foreground">Slots</th>
                  <th className="pb-2 font-medium text-muted-foreground">Conflicts</th>
                  <th className="pb-2 font-medium text-muted-foreground">Utilization</th>
                  <th className="pb-2 font-medium text-muted-foreground">Overtime</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.teacher} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{row.teacher}</td>
                    <td className="py-2 text-muted-foreground">{row.department}</td>
                    <td className="py-2 tabular-nums">{row.slots}</td>
                    <td className="py-2">
                      {row.conflicts > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">{row.conflicts}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            row.utilization >= 80 ? 'bg-emerald-500' :
                            row.utilization >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${row.utilization}%` }} />
                        </div>
                        <span className="tabular-nums text-xs">{row.utilization}%</span>
                      </div>
                    </td>
                    <td className="py-2 tabular-nums">{row.overtime}h</td>
                    <td className="py-2">
                      <Badge variant={
                        row.conflicts > 0 ? "destructive" :
                        row.utilization >= 80 ? "default" : "secondary"
                      } className="text-[10px]">
                        {row.conflicts > 0 ? "Conflicts" : row.utilization >= 80 ? "Optimal" : "Underutilized"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conflict Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Resolved</span>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {totalConflicts - Math.round(totalConflicts * 0.3)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Remaining</span>
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                {Math.round(totalConflicts * 0.3)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">65%</p>
            <p className="text-xs text-muted-foreground mt-1">Target: 80-90%</p>
            <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: "65%" }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scheduling Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgUtilization}%</p>
            <p className="text-xs text-muted-foreground mt-1">Overall schedule optimization</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}