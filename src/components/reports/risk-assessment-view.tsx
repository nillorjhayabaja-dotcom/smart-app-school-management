import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { ShieldAlert, AlertTriangle, AlertCircle, Activity, Users } from "lucide-react";
import type { RiskHeatmapRow } from "@/types/reports";

interface RiskAssessmentViewProps {
  data: RiskHeatmapRow[];
  loading: boolean;
}

export function RiskAssessmentView({ data, loading }: RiskAssessmentViewProps) {
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

  const totalHigh = data.reduce((s, d) => s + d.high, 0);
  const totalMedium = data.reduce((s, d) => s + d.medium, 0);
  const totalLow = data.reduce((s, d) => s + d.low, 0);
  const totalEmployees = totalHigh + totalMedium + totalLow;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" /> High Risk
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">{totalHigh}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalEmployees > 0 ? ((totalHigh / totalEmployees) * 100).toFixed(0) : 0}% of workforce requires immediate attention
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Medium Risk
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">{totalMedium}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Monitor and intervene as needed
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" /> Low Risk
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">{totalLow}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Stable workforce
          </CardContent>
        </Card>
      </div>

      {/* Risk Heatmap Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Assessment Matrix by Department</CardTitle>
          <CardDescription>Burnout risk, resignation risk, and workload risk analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Department</th>
                  <th className="pb-2 font-medium text-muted-foreground">Low</th>
                  <th className="pb-2 font-medium text-muted-foreground">Medium</th>
                  <th className="pb-2 font-medium text-muted-foreground">High</th>
                  <th className="pb-2 font-medium text-muted-foreground">Burnout Risk</th>
                  <th className="pb-2 font-medium text-muted-foreground">Resignation Risk</th>
                  <th className="pb-2 font-medium text-muted-foreground">Avg Workload</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.department} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 font-medium">{row.department}</td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400">{row.low}</td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400">{row.medium}</td>
                    <td className="py-2.5 text-red-600 dark:text-red-400 font-medium">{row.high}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            row.burnout >= 60 ? 'bg-red-500' :
                            row.burnout >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} style={{ width: `${row.burnout}%` }} />
                        </div>
                        <span className="tabular-nums text-xs">{row.burnout}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            row.resignation >= 60 ? 'bg-red-500' :
                            row.resignation >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} style={{ width: `${row.resignation}%` }} />
                        </div>
                        <span className="tabular-nums text-xs">{row.resignation}%</span>
                      </div>
                    </td>
                    <td className="py-2.5">{row.workload}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Risk Factors</CardTitle>
          <CardDescription>Top risk indicators across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 bg-red-500/5 border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Burnout Risk</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
                {data.length ? Math.round(data.reduce((s, d) => s + d.burnout, 0) / data.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Average burnout risk across departments</p>
            </div>
            <div className="rounded-lg border p-4 bg-amber-500/5 border-amber-200 dark:border-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Resignation Risk</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">
                {data.length ? Math.round(data.reduce((s, d) => s + d.resignation, 0) / data.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Average resignation probability</p>
            </div>
            <div className="rounded-lg border p-4 bg-blue-500/5 border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">High-Risk Employees</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">{totalHigh}</p>
              <p className="text-xs text-muted-foreground mt-1">Employees requiring immediate intervention</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}