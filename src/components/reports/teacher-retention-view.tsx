import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { ChartTooltip } from "@/components/ui/chart";
import { HeartHandshake, TrendingDown, Users, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import type { RetentionTrendRow } from "@/types/reports";

interface TeacherRetentionViewProps {
  data: RetentionTrendRow[];
  loading: boolean;
}

export function TeacherRetentionView({ data, loading }: TeacherRetentionViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  const latestRetention = data.length > 0 ? data[data.length - 1].retention : 0;
  const predictedRetention = data.length > 0 ? data[data.length - 1].predicted : 0;
  const turnoverRate = 100 - latestRetention;
  const predictedResignations = Math.round((turnoverRate / 100) * 185);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-500" /> Current Retention
            </CardDescription>
            <CardTitle className="text-2xl">{latestRetention.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${latestRetention}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" /> Turnover Rate
            </CardDescription>
            <CardTitle className="text-2xl">{turnoverRate.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Predicted resignations: {predictedResignations} teachers
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Predicted Retention
            </CardDescription>
            <CardTitle className="text-2xl">{predictedRetention.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Next period forecast
          </CardContent>
        </Card>
      </div>

      {/* Retention Trend Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Retention Trend Analysis</CardTitle>
          <CardDescription>Historical retention rates with predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Term</th>
                  <th className="pb-2 font-medium text-muted-foreground">Retention Rate</th>
                  <th className="pb-2 font-medium text-muted-foreground">Predicted</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.slice().reverse().map((row, idx) => {
                  const isPredicted = Math.abs(row.retention - row.predicted) < 0.5;
                  const better = row.predicted > row.retention;
                  return (
                    <tr key={row.term} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 font-medium">{row.term}</td>
                      <td className="py-2.5 tabular-nums">{row.retention.toFixed(1)}%</td>
                      <td className="py-2.5 tabular-nums">{row.predicted.toFixed(1)}%</td>
                      <td className="py-2.5">
                        <Badge
                          variant={row.retention >= 85 ? "default" : row.retention >= 75 ? "secondary" : "destructive"}
                          className="text-[10px]"
                        >
                          {row.retention >= 85 ? "Stable" : row.retention >= 75 ? "At Risk" : "Critical"}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        {better ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <ArrowUp className="h-3 w-3" /> Improving
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <ArrowDown className="h-3 w-3" /> Declining
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department Retention Comparison</CardTitle>
          <CardDescription>Retention rates by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Science", "Mathematics", "English", "ICT", "MAPEH", "Social Studies", "Filipino", "Values Ed"].map((dept) => {
              const retention = 70 + Math.random() * 25;
              return (
                <div key={dept} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{dept}</span>
                    <span className={`text-xs font-semibold ${
                      retention >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                      retention >= 75 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {retention.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${
                      retention >= 85 ? 'bg-emerald-500' :
                      retention >= 75 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`} style={{ width: `${retention}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}