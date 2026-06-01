import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { Building2, Users, LineChart as LineChartIcon, Activity, HeartHandshake, TrendingUp, ShieldAlert, Sparkles } from "lucide-react";

interface ExecutiveSummaryViewProps {
  data?: {
    schoolOverview: {
      name: string;
      address: string;
      academicYear: string;
      totalStudents: number;
      totalFaculty: number;
      avgWorkload: number;
      utilizationRate: number;
      retentionRate: number;
    };
  };
  loading: boolean;
}

export function ExecutiveSummaryView({ data, loading }: ExecutiveSummaryViewProps) {
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><ChartSkeleton height={40} /></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={80} />)}
            </div>
          </CardContent>
        </Card>
        <ChartSkeleton height={200} />
      </div>
    );
  }

  const { schoolOverview } = data;

  return (
    <div className="space-y-6">
      {/* School Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>School Overview</CardTitle>
                <CardDescription>{schoolOverview.address}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              AY {schoolOverview.academicYear}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold mt-1">{schoolOverview.totalStudents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{schoolOverview.name}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Faculty</p>
              <p className="text-3xl font-bold mt-1">{schoolOverview.totalFaculty}</p>
              <p className="text-xs text-muted-foreground mt-1">Teaching staff</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Average Workload</p>
              <p className="text-3xl font-bold mt-1">{schoolOverview.avgWorkload}%</p>
              <p className="text-xs text-muted-foreground mt-1">Capacity utilization</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Retention Rate</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{schoolOverview.retentionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">Teacher retention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workforce Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Workforce Overview</CardTitle>
              <CardDescription>Current workforce allocation and utilization metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Workload Distribution</span>
                <span className="text-sm font-medium">{schoolOverview.avgWorkload}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${schoolOverview.avgWorkload}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilization Rate</span>
                <span className="text-sm font-medium">{schoolOverview.utilizationRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${schoolOverview.utilizationRate}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Retention Rate</span>
                <span className="text-sm font-medium">{schoolOverview.retentionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${schoolOverview.retentionRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Executive dashboard summary metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">Student-Faculty Ratio</span>
              </div>
              <p className="text-xl font-bold">
                {(schoolOverview.totalStudents / schoolOverview.totalFaculty).toFixed(1)}:1
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Workforce Stability</span>
              </div>
              <p className="text-xl font-bold">Stable</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">Risk Level</span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">Moderate</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium text-muted-foreground">Departments</span>
              </div>
              <p className="text-xl font-bold">8</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Recommendations</span>
              </div>
              <p className="text-xl font-bold">10 Active</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-cyan-500" />
                <span className="text-xs font-medium text-muted-foreground">Forecast Horizon</span>
              </div>
              <p className="text-xl font-bold">5 Years</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}