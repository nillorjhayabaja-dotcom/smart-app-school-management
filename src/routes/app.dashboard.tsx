import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { CardSkeleton, ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService, recommendationService } from "@/services";
import { Users, TrendingUp, ShieldAlert, Sparkles, GraduationCap, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Workforce IQ" }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

function Dashboard() {
  const enrollment = useQuery({ queryKey: ["enrollment"], queryFn: analyticsService.enrollment });
  const summary = useQuery({ queryKey: ["enrollmentSummary"], queryFn: analyticsService.enrollmentSummary });
  const retention = useQuery({ queryKey: ["retention"], queryFn: analyticsService.retention });
  const workload = useQuery({ queryKey: ["workload"], queryFn: analyticsService.workload });
  const dist = useQuery({ queryKey: ["distribution"], queryFn: analyticsService.distribution });
  const activity = useQuery({ queryKey: ["activity"], queryFn: analyticsService.activity });
  const risk = useQuery({ queryKey: ["risk"], queryFn: analyticsService.risk });
  const recs = useQuery({ queryKey: ["recs"], queryFn: recommendationService.list });

  const s = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Predictive forecasts, workforce health, and prescriptive recommendations."
        actions={<><Button variant="outline" size="sm">Export</Button><Button size="sm">Run forecast</Button></>}
      />

      {/* KPIs — driven by unified summary data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Employees"
          value={s?.currentEmployees?.toString() ?? "48"}
          delta={3}
          icon={<Users className="h-4 w-4" />}
          hint="vs last term"
        />
        <KpiCard
          label="Current Enrollment"
          value={s?.currentEnrollment?.toLocaleString() ?? "—"}
          delta={s?.avgGrowthRate}
          icon={<GraduationCap className="h-4 w-4" />}
          hint={`${s?.avgGrowthRate}% avg growth`}
        />
        <KpiCard
          label="Year 3 Projected"
          value={s?.projectedYear3?.toLocaleString() ?? "—"}
          delta={s?.growthPercentage}
          icon={<TrendingUp className="h-4 w-4" />}
          hint="enrollment forecast"
        />
        <KpiCard
          label="Teacher Ratio (Year 3)"
          value={`1:${s?.projectedRatioYear3?.toFixed(1) ?? "—"}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint={s?.teachersDeficit ? `${s.teachersDeficit} teachers needed` : "PH std: 1:36–1:40"}
          className={s && s.projectedRatioYear3 > 40 ? "border-destructive" : ""}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Student Enrollment Trend" description="10-year history (unified data)" className="lg:col-span-2">
          {enrollment.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={enrollment.data}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="actual" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} name="Enrollment" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Teacher Retention Prediction" description="By term">
          {retention.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={retention.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="term" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[60, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="retention" stroke="var(--chart-1)" strokeWidth={2} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="4 3" name="Predicted" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Workload Monitoring" description="Average utilization by department">
          {workload.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={workload.data} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis dataKey="department" type="category" stroke="var(--muted-foreground)" fontSize={11} width={88} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="workload" radius={[0, 6, 6, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Teacher Distribution" description="Headcount by department">
          {dist.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dist.data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={88} paddingAngle={2}>
                  {dist.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Active vs Inactive" description="Current employment status">
          {activity.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={activity.data} dataKey="value" nameKey="name" outerRadius={88} label={{ fontSize: 11 }}>
                  {activity.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Risk Heatmap" description="Risk levels by department" className="lg:col-span-2">
          {risk.isLoading ? <CardSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="py-2">Department</th><th>Low</th><th>Medium</th><th>High</th></tr>
                </thead>
                <tbody>
                  {risk.data?.map((r) => (
                    <tr key={r.department} className="border-t">
                      <td className="py-2.5 font-medium">{r.department}</td>
                      {(["low","medium","high"] as const).map((k) => {
                        const v = r[k];
                        const max = k === "low" ? 12 : k === "medium" ? 8 : 5;
                        const intensity = Math.min(1, v / max);
                        const bg = k === "low" ? `color-mix(in oklab, var(--success) ${intensity * 100}%, transparent)`
                          : k === "medium" ? `color-mix(in oklab, var(--warning) ${intensity * 100}%, transparent)`
                          : `color-mix(in oklab, var(--destructive) ${intensity * 100}%, transparent)`;
                        return (
                          <td key={k}>
                            <div className="inline-flex h-8 w-12 items-center justify-center rounded-md text-xs font-semibold" style={{ background: bg }}>{v}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Recommendation Summary"
          description="Top prescriptive actions"
          action={<Badge variant="secondary">{recs.data?.length ?? 0}</Badge>}
        >
          {recs.isLoading ? <CardSkeleton /> : (
            <ul className="space-y-3">
              {recs.data?.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-md border bg-card p-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(r.confidence * 100)}% confidence · {r.impact} impact</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}