import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { Star, TrendingUp, Users, Trophy, ArrowUp, ArrowDown } from "lucide-react";
import type { PerformanceRow } from "@/types/reports";

interface PerformanceAnalysisViewProps {
  data: PerformanceRow[];
  loading: boolean;
}

export function PerformanceAnalysisView({ data, loading }: PerformanceAnalysisViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  const avgPerformance = data.length ? Math.round(data.reduce((s, d) => s + d.performance, 0) / data.length) : 0;
  const avgAttendance = data.length ? Math.round(data.reduce((s, d) => s + d.attendance, 0) / data.length) : 0;
  const avgFeedback = data.length ? Math.round(data.reduce((s, d) => s + d.feedback, 0) / data.length) : 0;
  const topPerformers = data.filter((d) => d.performance >= 90).length;
  const needsImprovement = data.filter((d) => d.performance < 70).length;

  const sortedByPerformance = [...data].sort((a, b) => b.performance - a.performance);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" /> Avg Performance
            </CardDescription>
            <CardTitle className="text-2xl">{avgPerformance}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-emerald-500" /> Top Performers
            </CardDescription>
            <CardTitle className="text-2xl">{topPerformers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Avg Attendance
            </CardDescription>
            <CardTitle className="text-2xl">{avgAttendance}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-purple-500" /> Needs Improvement
            </CardDescription>
            <CardTitle className="text-2xl">{needsImprovement}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teacher Performance Ratings</CardTitle>
          <CardDescription>Individual performance metrics with attendance and feedback scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Teacher</th>
                  <th className="pb-2 font-medium text-muted-foreground">Department</th>
                  <th className="pb-2 font-medium text-muted-foreground">Performance</th>
                  <th className="pb-2 font-medium text-muted-foreground">Workload</th>
                  <th className="pb-2 font-medium text-muted-foreground">Attendance</th>
                  <th className="pb-2 font-medium text-muted-foreground">Feedback</th>
                  <th className="pb-2 font-medium text-muted-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sortedByPerformance.slice(0, 20).map((row, idx) => (
                  <tr key={row.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 text-muted-foreground">{row.department}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            row.performance >= 85 ? 'bg-emerald-500' :
                            row.performance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${row.performance}%` }} />
                        </div>
                        <span className="tabular-nums text-xs">{row.performance}%</span>
                      </div>
                    </td>
                    <td className="py-2 tabular-nums">{row.workload}%</td>
                    <td className="py-2 tabular-nums">{row.attendance}%</td>
                    <td className="py-2 tabular-nums">{row.feedback}%</td>
                    <td className="py-2">
                      <Badge variant={row.performance >= 85 ? "default" : row.performance >= 70 ? "secondary" : "destructive"} className="text-[10px]">
                        {row.performance >= 85 ? "Excellent" : row.performance >= 70 ? "Good" : "Needs Work"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 20 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Showing top 20 of {data.length} teachers
            </p>
          )}
        </CardContent>
      </Card>

      {/* Department Comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(data.map((d) => d.department))).slice(0, 8).map((dept) => {
                const deptData = data.filter((d) => d.department === dept);
                const avgDeptPerf = deptData.length ? Math.round(deptData.reduce((s, d) => s + d.performance, 0) / deptData.length) : 0;
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-xs font-medium">{dept}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${
                          avgDeptPerf >= 85 ? 'bg-emerald-500' :
                          avgDeptPerf >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`} style={{ width: `${avgDeptPerf}%` }} />
                      </div>
                      <span className="text-xs tabular-nums">{avgDeptPerf}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Training Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.filter((d) => d.training > 0).slice(0, 8).map((row) => (
                <div key={row.name} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{row.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">Training: {row.training}h</span>
                    <span className={`text-xs font-semibold ${
                      row.performance >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>{row.performance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}