import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { TrendingUp, Users, BarChart3, Target, ArrowUp, ArrowDown } from "lucide-react";
import type { EnrollmentForecastRow } from "@/types/reports";
import type { EnrollmentSummary } from "@/types";

interface EnrollmentForecastViewProps {
  data: EnrollmentForecastRow[];
  summary?: EnrollmentSummary;
  loading: boolean;
}

export function EnrollmentForecastView({ data, summary, loading }: EnrollmentForecastViewProps) {
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

  const current = data.find((d) => d.historical !== null && d.year === new Date().getFullYear());
  const lastHistorical = data.filter((d) => d.historical !== null).pop();
  const forecastData = data.filter((d) => d.predicted !== null);

  const growthRate = lastHistorical && current
    ? ((current.predicted - (lastHistorical.historical ?? lastHistorical.predicted)) / (lastHistorical.historical ?? lastHistorical.predicted) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Current Enrollment
            </CardDescription>
            <CardTitle className="text-2xl">{summary?.currentEnrollment?.toLocaleString() ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Projected (Year 1)
            </CardDescription>
            <CardTitle className="text-2xl">{summary?.projectedYear1?.toLocaleString() ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> Growth Rate
            </CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              {summary?.totalGrowth != null ? (
                <>
                  {summary.totalGrowth >= 0 ? (
                    <ArrowUp className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500" />
                  )}
                  {Math.abs(summary.totalGrowth).toFixed(1)}%
                </>
              ) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-purple-500" /> Forecast Accuracy
            </CardDescription>
            <CardTitle className="text-2xl">{summary?.confidence ? `${summary.confidence}%` : "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 8-Year History + Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enrollment Data — 8-Year History & 5-Year Forecast</CardTitle>
          <CardDescription>Historical enrollment with predicted values and confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Year</th>
                  <th className="pb-2 font-medium text-muted-foreground">Historical</th>
                  <th className="pb-2 font-medium text-muted-foreground">Predicted</th>
                  <th className="pb-2 font-medium text-muted-foreground">Optimistic</th>
                  <th className="pb-2 font-medium text-muted-foreground">Conservative</th>
                  <th className="pb-2 font-medium text-muted-foreground">Teachers</th>
                  <th className="pb-2 font-medium text-muted-foreground">Student:Teacher</th>
                </tr>
              </thead>
              <tbody>
                {data.slice().reverse().map((row) => (
                  <tr key={row.year} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 font-medium">{row.year}</td>
                    <td className="py-2.5">
                      {row.historical != null ? (
                        <span className="text-emerald-600 dark:text-emerald-400">{row.historical.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className="font-medium tabular-nums">{row.predicted.toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {row.optimistic?.toLocaleString() ?? "—"}
                    </td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400 tabular-nums">
                      {row.conservative?.toLocaleString() ?? "—"}
                    </td>
                    <td className="py-2.5">{row.employees ?? "—"}</td>
                    <td className="py-2.5">{row.teacherStudentRatio?.toFixed(1) ?? "—"}:1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staffing Demand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staffing Demand Analysis</CardTitle>
          <CardDescription>Teachers needed based on projected enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Deficit</p>
              <p className="text-2xl font-bold mt-1">{Math.ceil(summary?.teachersDeficit ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Teachers needed now</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Year 1 Needs</p>
              <p className="text-2xl font-bold mt-1">{Math.ceil(summary?.teachersDeficit ? summary.teachersDeficit * 1.1 : 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Projected for next year</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Year 5 Needs</p>
              <p className="text-2xl font-bold mt-1">{Math.ceil(summary?.teachersDeficit ? summary.teachersDeficit * 1.5 : 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Projected in 5 years</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}