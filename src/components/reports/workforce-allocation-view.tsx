import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { Network, Users, Activity, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import type { WorkloadByDeptRow } from "@/types/reports";

interface WorkforceAllocationViewProps {
  data: WorkloadByDeptRow[];
  loading: boolean;
}

export function WorkforceAllocationView({ data, loading }: WorkforceAllocationViewProps) {
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

  const totalOverloaded = data.reduce((s, d) => s + d.overloaded, 0);
  const totalUnderutilized = data.reduce((s, d) => s + d.underutilized, 0);
  const totalBalanced = data.reduce((s, d) => s + d.balanced, 0);
  const totalEmployees = totalOverloaded + totalUnderutilized + totalBalanced;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Overloaded
            </CardDescription>
            <CardTitle className="text-2xl">{totalOverloaded}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalEmployees > 0 ? ((totalOverloaded / totalEmployees) * 100).toFixed(0) : 0}% of workforce
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Balanced
            </CardDescription>
            <CardTitle className="text-2xl">{totalBalanced}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalEmployees > 0 ? ((totalBalanced / totalEmployees) * 100).toFixed(0) : 0}% of workforce
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Underutilized
            </CardDescription>
            <CardTitle className="text-2xl">{totalUnderutilized}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalEmployees > 0 ? ((totalUnderutilized / totalEmployees) * 100).toFixed(0) : 0}% of workforce
          </CardContent>
        </Card>
      </div>

      {/* Department Allocation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department Allocation</CardTitle>
          <CardDescription>Workload distribution by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Department</th>
                  <th className="pb-2 font-medium text-muted-foreground">Avg Workload</th>
                  <th className="pb-2 font-medium text-muted-foreground">Overloaded</th>
                  <th className="pb-2 font-medium text-muted-foreground">Balanced</th>
                  <th className="pb-2 font-medium text-muted-foreground">Underutilized</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const statusColor = row.workload > 85 ? 'text-red-600 dark:text-red-400' : row.workload < 60 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                  const statusLabel = row.workload > 85 ? 'Overloaded' : row.workload < 60 ? 'Underutilized' : 'Optimal';
                  return (
                    <tr key={row.department} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 font-medium">{row.department}</td>
                      <td className="py-2.5">
                        <span className={`font-medium ${statusColor}`}>{row.workload}%</span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-red-600 dark:text-red-400">{row.overloaded}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-emerald-600 dark:text-emerald-400">{row.balanced}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-amber-600 dark:text-amber-400">{row.underutilized}</span>
                      </td>
                      <td className="py-2.5">
                        <Badge variant={row.workload > 85 ? "destructive" : row.workload < 60 ? "secondary" : "default"} className="text-[10px]">
                          {statusLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allocation Efficiency</CardTitle>
          <CardDescription>Overall workforce allocation metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Efficiency Score</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {totalEmployees > 0 ? Math.round((totalBalanced / totalEmployees) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Redistribution Needed</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {totalOverloaded}
              </p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Optimal Allocation</p>
              <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                {totalBalanced} / {totalEmployees}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}