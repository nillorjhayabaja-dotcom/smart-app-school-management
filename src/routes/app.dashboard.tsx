import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { InsightSummary } from "@/components/shared/InsightSummary";
import { RecommendationCard } from "@/components/shared/recommendation-card";
import { AnalyticsStatus } from "@/components/shared/analytics-status";
import { CardSkeleton, ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService, recommendationService } from "@/services";
import { Users, TrendingUp, ShieldAlert, Sparkles, GraduationCap, AlertTriangle, Zap } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Button } from "@/components/ui/button";
import { getTooltipStyle, getGridStyle, getLegendStyle } from "@/lib/chart-utils";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Workforce IQ" }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = getTooltipStyle();
const gridStyle = getGridStyle();
const legendStyle = getLegendStyle();

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

  // Calculate top risk departments
  const topRiskDepts = risk.data
    ?.sort((a, b) => b.high - a.high)
    .slice(0, 3) ?? [];

  // Map recommendation to priority level
  const mapPriority = (index: number) => {
    if (index === 0) return "critical";
    if (index === 1) return "high";
    if (index === 2) return "medium";
    return "low";
  };

  return (
    <div className="space-y-8 pb-8">
      {/* EXECUTIVE SUMMARY BANNER */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Executive Summary
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Current workforce and forecast insights</p>
          </div>
          <AnalyticsStatus
            forecastUpdated="2 hours ago"
            modelAccuracy={94}
            dataFreshness="Current Semester"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-primary/20 bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workforce Health</p>
            <p className="text-2xl font-bold text-foreground mt-2">{summary.data?.growthPercentage ?? "—"}%</p>
            <p className="text-xs text-muted-foreground mt-1">Score out of 100</p>
          </div>
          <div className="rounded-lg border border-success/20 bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Enrollment Forecast</p>
            <p className="text-2xl font-bold text-success mt-2">
              {summary.data?.avgGrowthRate ? `+${summary.data.avgGrowthRate}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Next year projection</p>
          </div>
          <div className="rounded-lg border border-info/20 bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Retention Forecast</p>
            <p className="text-2xl font-bold text-info mt-2">{retention.data?.at(-1)?.predicted ?? "—"}%</p>
            <p className="text-xs text-muted-foreground mt-1">Predicted rate</p>
          </div>
          <div className="rounded-lg border border-warning/20 bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">High Risk Staff</p>
            <p className="text-2xl font-bold text-warning mt-2">{risk.data?.filter(r => r.high > 0).length ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Departments affected</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-card/80 backdrop-blur p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Priority</p>
            <p className="text-sm font-semibold text-foreground mt-2 truncate">
              {recs.data?.[0]?.title ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">AI recommendation</p>
          </div>
        </div>
      </div>

      {/* PAGE HEADER */}
      <PageHeader
        title="Dashboard"
        description="Predictive forecasts, workforce health, and prescriptive recommendations."
        actions={<><Button variant="outline" size="sm">Export</Button><Button size="sm">Run forecast</Button></>}
      />

      {/* RECOMMENDATIONS SECTION */}
      {recs.data && recs.data.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              AI Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">Priority-ordered actions to optimize workforce</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {recs.data.slice(0, 4).map((r, idx) => (
              <RecommendationCard
                key={r.id}
                title={r.title}
                priority={mapPriority(idx)}
                confidence={r.confidence}
                impact={r.impact}
                onAction={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* KPI SECTION */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Key Performance Indicators</h3>
          <p className="text-sm text-muted-foreground">Current workforce metrics and forecasts</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total Employees"
            value={s?.currentEmployees?.toString() ?? "48"}
            delta={3}
            comparison="Steady growth compared to last term"
            confidence={95}
            context="Workforce capacity improving"
            icon={<Users className="h-4 w-4" />}
            hint="vs last term"
          />
          <KpiCard
            label="Current Enrollment"
            value={s?.currentEnrollment?.toLocaleString() ?? "—"}
            delta={s?.avgGrowthRate}
            comparison="Enrollment trending upward"
            confidence={92}
            context="Consistent year-over-year growth"
            icon={<GraduationCap className="h-4 w-4" />}
            hint={`${s?.avgGrowthRate}% avg growth`}
          />
          <KpiCard
            label="Year 3 Projected"
            value={s?.projectedYear3?.toLocaleString() ?? "—"}
            delta={s?.growthPercentage}
            comparison="Strong long‑term upward projection"
            confidence={88}
            context="Model predicts continued expansion"
            icon={<TrendingUp className="h-4 w-4" />}
            hint="enrollment forecast"
          />
          <KpiCard
            label="Teacher Ratio (Year 3)"
            value={`1:${s?.projectedRatioYear3?.toFixed(1) ?? "—"}`}
            comparison="Projected staffing pressure increasing"
            confidence={90}
            context={s?.teachersDeficit ? `${s.teachersDeficit} additional teachers required` : "Meets national standards"}
            icon={<AlertTriangle className="h-4 w-4" />}
            hint={s?.teachersDeficit ? `${s.teachersDeficit} teachers needed` : "PH std: 1:36–1:40"}
            className={s && s.projectedRatioYear3 > 40 ? "border-destructive/30 bg-destructive/5" : ""}
          />
        </div>
      </div>

      {/* FORECASTS SECTION */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Forecasts & Predictions</h3>
          <p className="text-sm text-muted-foreground">Predictive models for enrollment and retention</p>
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
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="actual" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} name="Enrollment" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <InsightSummary
              title="Enrollment Trend"
              body={(() => {
                const d = enrollment.data;
                if (!d || d.length === 0) return "";
                const first = d[0]?.actual ?? 0;
                const last = d[d.length - 1]?.actual ?? 0;
                const diff = last - first;
                const pct = ((diff / first) * 100).toFixed(1);
                return diff > 0
                  ? `Enrollment increased by ${diff} students (${pct}%) over the period.`
                  : `Enrollment decreased by ${Math.abs(diff)} students (${pct}%) over the period.`;
              })()}
              recommendation={recs.data?.[0]?.title ? <>→ {recs.data[0].title}</> : undefined}
            />
          </ChartCard>

          <ChartCard title="Teacher Retention Prediction" description="By term">
            {retention.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={retention.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="term" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[60, 100]} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Line type="monotone" dataKey="retention" stroke="var(--chart-1)" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="4 3" name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            )}
            <InsightSummary
              title="Retention Outlook"
              body={`Current retention at ${retention.data?.at(-1)?.retention ?? "—"}%, predicted to reach ${retention.data?.at(-1)?.predicted ?? "—"}% next term.`}
            />
          </ChartCard>
        </div>
      </div>

      {/* RISKS SECTION */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Risk Assessment
          </h3>
          <p className="text-sm text-muted-foreground">Workforce and operational risk indicators</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Risk Heatmap" description="Risk levels by department" className="lg:col-span-2">
            {risk.isLoading ? <CardSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Low</th>
                      <th className="py-3 px-3">Medium</th>
                      <th className="py-3 px-3">High</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risk.data?.map((r) => (
                      <tr key={r.department} className="border-t hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground">{r.department}</td>
                        {(["low", "medium", "high"] as const).map((k) => {
                          const v = r[k];
                          const max = k === "low" ? 12 : k === "medium" ? 8 : 5;
                          const intensity = Math.min(1, v / max);
                          const bg = k === "low" ? `color-mix(in oklab, var(--success) ${intensity * 100}%, transparent)`
                            : k === "medium" ? `color-mix(in oklab, var(--warning) ${intensity * 100}%, transparent)`
                            : `color-mix(in oklab, var(--destructive) ${intensity * 100}%, transparent)`;
                          return (
                            <td key={k} className="py-3 px-3">
                              <div className="inline-flex h-8 w-12 items-center justify-center rounded-md text-xs font-semibold text-foreground" style={{ background: bg }}>{v}</div>
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

          <ChartCard title="Top Risk Departments" description="Priority intervention">
            {risk.isLoading ? <CardSkeleton /> : (
              <ul className="space-y-3">
                {topRiskDepts.map((dept, idx) => (
                  <li key={dept.department} className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/20 text-destructive font-semibold text-xs">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{dept.department}</p>
                      <p className="text-xs text-muted-foreground">{dept.high} high-risk staff</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Analytics & Distribution</h3>
          <p className="text-sm text-muted-foreground">Department workload and resource utilization</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Workload Monitoring" description="Average utilization by department">
            {workload.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workload.data} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis dataKey="department" type="category" stroke="var(--muted-foreground)" fontSize={11} width={88} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="workload" radius={[0, 6, 6, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            )}
            <InsightSummary
              title="Workload Status"
              body="Monitor department utilization to identify bottlenecks and optimize resource allocation."
            />
          </ChartCard>

          <ChartCard title="Teacher Distribution" description="Headcount by department">
            {dist.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={dist.data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {dist.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
<Tooltip
  contentStyle={tooltipStyle}
  labelStyle={{ color: "var(--foreground)" }}
  itemStyle={{ color: "var(--foreground)" }}
/>
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Active vs Inactive" description="Current employment status">
            {activity.isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={activity.data}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={88}
                  >
                    {activity.data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
<Tooltip
  contentStyle={tooltipStyle}
  labelStyle={{ color: "var(--foreground)" }}
  itemStyle={{ color: "var(--foreground)" }}
/>
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}