import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";

import { ChartCard } from "@/components/shared/chart-card";
import { ChartSkeleton, TableSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import { EnrollmentSummary } from "@/types";
import { analyticsService, employeeService, schedulingService, auditService } from "@/services";
import {
  Activity,
  ClipboardCheck,
  Database,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  GraduationCap,
  HeartPulse,
  Printer,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const currentYear = new Date().getFullYear();

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

const allowedRoles = new Set<string>(["super_admin", "hr_admin"]);

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports · Workforce IQ" }] }),
  component: Page,
});

type ReportId =
  | "executive"
  | "enrollment_forecast"
  | "workforce_allocation"
  | "retention"
  | "performance"
  | "strand_analysis"
  | "risk_assessment"
  | "skill_gap"
  | "scheduling_efficiency"
  | "recommendations"
  | "predictive"
  | "audit";

interface ReportDef {
  id: ReportId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const REPORTS: ReportDef[] = [
  {
    id: "executive",
    label: "Executive Summary",
    icon: <Sparkles className="h-4 w-4" />,
    description: "What happened, why, what will happen, and what to do next.",
  },
  {
    id: "enrollment_forecast",
    label: "Enrollment Forecast",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Historical + forecast trends with confidence bands and staffing gap.",
  },
  {
    id: "workforce_allocation",
    label: "Workforce Allocation",
    icon: <Activity className="h-4 w-4" />,
    description: "Overloaded / underutilized / balanced workload.",
  },
  {
    id: "retention",
    label: "Teacher Retention",
    icon: <HeartPulse className="h-4 w-4" />,
    description: "Retention trend, turnover proxy, and predicted resignations.",
  },
  {
    id: "performance",
    label: "Teacher Performance",
    icon: <Star className="h-4 w-4" />,
    description: "Performance vs workload scatter (mock).",
  },
  {
    id: "strand_analysis",
    label: "Strand Analysis",
    icon: <GraduationCap className="h-4 w-4" />,
    description: "Strand staffing pressure estimate (placeholder).",
  },
  {
    id: "risk_assessment",
    label: "Risk Assessment",
    icon: <ShieldAlert className="h-4 w-4" />,
    description: "Low / medium / high risk + intervention callouts.",
  },
  {
    id: "skill_gap",
    label: "Skill Gap Analysis",
    icon: <Target className="h-4 w-4" />,
    description: "Training priorities from recommendations (mock).",
  },
  {
    id: "scheduling_efficiency",
    label: "Scheduling Efficiency",
    icon: <Activity className="h-4 w-4" />,
    description: "Conflicts + utilization (placeholder).",
  },
  {
    id: "recommendations",
    label: "Recommendation Report",
    icon: <ClipboardCheck className="h-4 w-4" />,
    description: "Actions with reason + confidence.",
  },
  {
    id: "predictive",
    label: "Predictive Analytics",
    icon: <Sparkles className="h-4 w-4" />,
    description: "Enrollment, resignations, staffing, risk.",
  },
  {
    id: "audit",
    label: "Audit & Compliance",
    icon: <Users className="h-4 w-4" />,
    description: "Track actions and exports (mock).",
  },
];

function metricPercent(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Retention Chart ────────────────────────────────────────────────────────
function RetentionChart({
  data,
}: {
  data: Array<{ term: string; retention: number; predicted: number }>;
}) {
  const isEmpty =
    !data || data.length === 0 || data.every((d) => d.retention === 0 && d.predicted === 0);
  if (isEmpty) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
        <HeartPulse className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm font-medium">No retention data available</p>
        <p className="mt-1 text-xs">No historical snapshots or employee records exist yet.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="term" stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[70, 100]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          y={85}
          stroke="var(--muted-foreground)"
          strokeDasharray="3 3"
          strokeOpacity={0.5}
          label={{
            value: "Benchmark 85%",
            position: "insideBottomRight",
            fontSize: 9,
            fill: "var(--muted-foreground)",
          }}
        />
        <Line
          type="monotone"
          dataKey="retention"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--chart-1)" }}
          activeDot={{ r: 5 }}
          name="retention"
        />
        <Line
          type="monotone"
          dataKey="predicted"
          stroke="var(--chart-3)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--chart-3)" }}
          activeDot={{ r: 5 }}
          strokeDasharray="5 4"
          name="predicted"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type EnrollmentForecastRow = {
  year: number;
  historical: number | null;
  predicted: number;
  optimistic: number;
  conservative: number;
  employees: number;
  teachersNeeded: number;
  teacherStudentRatio: number;
  employeeSurplus: number;
};
type RiskHeatmapRow = { department: string; low: number; medium: number; high: number };
type PlanningRecommendation = {
  id?: string;
  title?: string;
  description?: string;
  confidence?: number;
  /** Engine field: rationale is the “reason” */
  rationale?: string;
  /** Engine field: timeline is optional */
  timeline?: string;
  /** Engine field: impact is optional */
  impact?: string;
  /** Legacy/UI aliases */
  action?: string;
  reason?: string;
  related?: string[];
};
type WorkloadByDeptRow = { department: string; workload: number };
type RetentionTrendRow = { term: string; retention: number; predicted: number };

// ── Enrollment components ──────────────────────────────────────────────────
function HistoricalForecastTrend({ forecast }: { forecast: EnrollmentForecastRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <AreaChart data={forecast}>
        <defs>
          <linearGradient id="rptGHist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="rptGPred" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="year"
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => String(v)}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine
          x={currentYear}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{ value: "Now", position: "top", fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <Area
          type="monotone"
          dataKey="historical"
          stroke="var(--chart-1)"
          fill="url(#rptGHist)"
          strokeWidth={2}
          connectNulls={false}
          name="historical"
        />
        <Area
          type="monotone"
          dataKey="optimistic"
          stroke="var(--chart-3)"
          fill="none"
          strokeWidth={1}
          strokeDasharray="3 3"
          connectNulls={false}
          name="optimistic"
        />
        <Area
          type="monotone"
          dataKey="conservative"
          stroke="var(--chart-4)"
          fill="none"
          strokeWidth={1}
          strokeDasharray="3 3"
          connectNulls={false}
          name="conservative"
        />
        <Area
          type="monotone"
          dataKey="predicted"
          stroke="var(--chart-2)"
          fill="url(#rptGPred)"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          connectNulls={false}
          name="predicted"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EnrollmentConfidence({
  forecast,
}: {
  forecast: Array<EnrollmentForecastRow & { historical: null | number }>;
}) {
  const fut = forecast.filter((d) => d.historical === null);
  const data = fut.map((d) => ({
    year: d.year,
    optimistic: d.optimistic,
    conservative: d.conservative,
    predicted: d.predicted,
  }));
  return (
    <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
      <defs>
        <linearGradient id="gConfCons" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gConfOpt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
      <YAxis stroke="var(--muted-foreground)" fontSize={11} />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Area
        type="monotone"
        dataKey="conservative"
        stroke="var(--chart-3)"
        strokeWidth={1}
        fillOpacity={1}
        fill="url(#gConfCons)"
        name="Conservative"
      />
      <Area
        type="monotone"
        dataKey="optimistic"
        stroke="var(--chart-2)"
        strokeWidth={1}
        fillOpacity={1}
        fill="url(#gConfOpt)"
        name="Optimistic"
      />
      <Line
        type="monotone"
        dataKey="predicted"
        stroke="var(--chart-1)"
        strokeWidth={2}
        dot={false}
        name="Predicted"
      />
    </ComposedChart>
  );
}

// ── Shared chart components ────────────────────────────────────────────────
function RiskPie({ risk }: { risk: RiskHeatmapRow[] }) {
  const totals = (risk ?? []).reduce(
    (acc: { low: number; medium: number; high: number }, r: RiskHeatmapRow) => {
      acc.low += r.low;
      acc.medium += r.medium;
      acc.high += r.high;
      return acc;
    },
    { low: 0, medium: 0, high: 0 },
  );
  const data = [
    { name: "Low", value: totals.low },
    { name: "Medium", value: totals.medium },
    { name: "High", value: totals.high },
  ];
  return (
    <PieChart>
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius={48}
        outerRadius={88}
        paddingAngle={2}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}

function PerformanceScatter({
  data,
}: {
  data: Array<{ workload: number; performance: number; name?: string }>;
}) {
  return (
    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis
        type="number"
        dataKey="workload"
        stroke="var(--muted-foreground)"
        fontSize={11}
        name="Workload"
      />
      <YAxis
        type="number"
        dataKey="performance"
        stroke="var(--muted-foreground)"
        fontSize={11}
        name="Performance"
      />
      <Tooltip contentStyle={tooltipStyle} />
      <Legend wrapperStyle={{ fontSize: 11 }} />
      <Scatter name="Teachers" data={data} fill="var(--chart-1)" />
    </ScatterChart>
  );
}

// ── Page component ─────────────────────────────────────────────────────────
function Page() {
  const { user } = useAuth();
  const { push } = useNotifications();
  const navigate = useNavigate();

  if (!user || !allowedRoles.has(user.role)) {
    navigate({ to: "/app" });
    return null;
  }

  const employeesQ = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });
  const workloadQ = useQuery({ queryKey: ["workload"], queryFn: analyticsService.workload });
  const riskQ = useQuery({ queryKey: ["risk"], queryFn: analyticsService.risk });
  const forecastQ = useQuery<EnrollmentForecastRow[]>({
    queryKey: ["enrollmentForecast3Year"],
    queryFn: analyticsService.enrollmentForecast3Year,
  });
  const summaryQ = useQuery<EnrollmentSummary>({
    queryKey: ["enrollmentSummary"],
    queryFn: analyticsService.enrollmentSummary,
  });
  const retentionQ = useQuery({
    queryKey: ["retentionTrend"],
    queryFn: analyticsService.retention,
  });
  const performanceQ = useQuery({
    queryKey: ["performanceScatter"],
    queryFn: analyticsService.performanceScatter,
  });
  const planningRecsQ = useQuery({
    queryKey: ["planningRecommendations"],
    queryFn: analyticsService.planningRecommendations,
  });
  const scheduleQ = useQuery({ queryKey: ["schedule"], queryFn: schedulingService.list });
  const auditQ = useQuery({ queryKey: ["auditLogs"], queryFn: auditService.list });

  const getQueryError = (q: { isError: boolean; error: unknown }, label: string) => {
    if (!q?.isError) return null;
    const err = q.error;
    if (err instanceof Error) return `${label}: ${err.message}`;
    if (typeof err === "string") return `${label}: ${err}`;
    if (err && typeof err === "object" && "message" in err)
      return `${label}: ${(err as { message?: unknown }).message}`;
    return `${label}: Unknown error`;
  };

  const loading = {
    employees: employeesQ.isLoading,
    workload: workloadQ.isLoading,
    risk: riskQ.isLoading,
    forecast3Year: forecastQ.isLoading,
    summary: summaryQ.isLoading,
    retentionTrend: retentionQ.isLoading,
    performanceScatter: performanceQ.isLoading,
    planningRecommendations: planningRecsQ.isLoading,
    schedule: scheduleQ.isLoading,
    audit: auditQ.isLoading,
  };

  const error = {
    employees: getQueryError(employeesQ, "Employees"),
    workload: getQueryError(workloadQ, "Workload"),
    risk: getQueryError(riskQ, "Risk"),
    forecast3Year: getQueryError(forecastQ, "Enrollment forecast"),
    summary: getQueryError(summaryQ, "Enrollment summary"),
    retentionTrend: getQueryError(retentionQ, "Retention trend"),
    performanceScatter: getQueryError(performanceQ, "Performance scatter"),
    planningRecommendations: getQueryError(planningRecsQ, "Planning recommendations"),
    schedule: getQueryError(scheduleQ, "Schedule"),
    audit: getQueryError(auditQ, "Audit logs"),
  };

  const errorMessages = Object.values(error).filter(Boolean) as string[];
  const isLoadingAny = Object.values(loading).some(Boolean);
  const hasAnyError = errorMessages.length > 0;

  const employees = employeesQ.data ?? [];
  const workload = workloadQ.data ?? [];
  const risk = riskQ.data ?? [];
  const forecast3Year = forecastQ.data ?? [];
  const enrollmentSummary = summaryQ.data ?? {
    currentEnrollment: 0,
    projectedYear1: 0,
    totalGrowth: 0,
    growthPercentage: 0,
    teachersDeficit: 0,
    confidence: "N/A",
    teachersNeededYear3: 0,
  }; // Initialize with default values
  const retentionTrend = retentionQ.data ?? [];
  const performanceScatter = performanceQ.data ?? [];
  const planningRecommendations = planningRecsQ.data ?? [];
  const schedule = (scheduleQ.data ?? []) as any[];
  const auditLogs = (auditQ.data ?? []) as any[];

  const [activeTab, setActiveTab] = useState<ReportId>("executive");

  const kpis = useMemo(() => {
    const totalStudents = enrollmentSummary?.currentEnrollment ?? 0;
    const totalTeachers = employees.length;
    const activeTeachers = employees.filter((e) => e.status === "active").length;
    const studentTeacherRatio = activeTeachers > 0 ? totalStudents / activeTeachers : 0;
    const avgWorkloadActive = (() => {
      const active = employees.filter((e) => e.status === "active");
      if (!active.length) return 0;
      return active.reduce((s, e) => s + e.workload, 0) / active.length;
    })();
    const utilizationRate = clamp(avgWorkloadActive, 0, 100);
    const avgPerformance = employees.length
      ? employees.reduce((s, e) => s + e.performance, 0) / employees.length
      : 0;
    const highRiskTeachers = employees.filter(
      (e) => e.retentionRisk === "high" && e.status !== "inactive",
    ).length;
    const retentionRate = retentionTrend.length
      ? retentionTrend.reduce((s: number, t: RetentionTrendRow) => s + t.retention, 0) /
        retentionTrend.length
      : 0;
    return {
      totalStudents,
      totalTeachers,
      activeTeachers,
      studentTeacherRatio,
      utilizationRate,
      avgPerformance,
      teacherRetentionRate: clamp(retentionRate, 0, 100),
      teacherTurnoverRate: clamp(100 - retentionRate, 0, 100),
      highRiskTeachers,
      projectedEnrollmentNextYear: enrollmentSummary?.projectedYear1 ?? 0,
      projectedStaffingGap: enrollmentSummary?.teachersDeficit ?? 0,
    };
  }, [employees, enrollmentSummary, retentionTrend]);

  const headerSubtitle = REPORTS.find((r) => r.id === activeTab)?.description ?? "";

  const handleExportCSV = () => {
    try {
      if (activeTab === "executive") {
        const headers = ["Section", "Metric", "Value"];
        const kpiRows: string[][] = [
          ["Executive KPIs", "Total Students", String(kpis.totalStudents)],
          ["Executive KPIs", "Total Teachers", String(kpis.totalTeachers)],
          ["Executive KPIs", "Student-Teacher Ratio (active)", kpis.studentTeacherRatio.toFixed(2)],
          ["Executive KPIs", "Teacher Utilization Rate", metricPercent(kpis.utilizationRate)],
          ["Executive KPIs", "Average Teacher Performance", metricPercent(kpis.avgPerformance)],
          ["Executive KPIs", "Teacher Retention Rate", metricPercent(kpis.teacherRetentionRate)],
          [
            "Executive KPIs",
            "Teacher Turnover Rate (proxy)",
            metricPercent(kpis.teacherTurnoverRate),
          ],
          ["Executive KPIs", "High-Risk Teachers", String(kpis.highRiskTeachers)],
          [
            "Executive KPIs",
            "Projected Enrollment Next Year",
            String(kpis.projectedEnrollmentNextYear),
          ],
          [
            "Executive KPIs",
            "Projected Staffing Gap (teachers)",
            String(Math.round(kpis.projectedStaffingGap)),
          ],
        ];
        const topDriversRows: string[][] = topRiskDepts.map((d: any) => {
          const wl =
            topWorkloadDepts.find((x: any) => x.department === d.department)?.workload ?? "";
          return [
            "Top Drivers",
            d.department,
            `High=${d.high ?? 0}; Workload=${wl === "" ? "" : `${wl}%`}`,
          ];
        });
        const topActions = planningRecommendations.slice(0, 3);
        const topActionsRows: string[][] = topActions.map((r: any, idx: number) => [
          "Top Actions",
          String(idx + 1),
          `${r.title ?? `Recommendation #${idx + 1}`} (Confidence=${Math.round(r.confidence ?? 0)}%)`,
        ]);
        downloadCSV("Executive_Summary.csv", headers, [
          ...kpiRows,
          ...topDriversRows,
          ...topActionsRows,
        ]);
        push({
          title: "Export Ready",
          message: "Executive Summary CSV exported.",
          severity: "info",
        });
        return;
      }

      if (activeTab === "enrollment_forecast") {
        const headers = ["Year", "Historical", "Predicted", "Optimistic", "Conservative"];
        const rows = forecast3Year.map((d: EnrollmentForecastRow) => [
          String(d.year),
          d.historical === null ? "" : String(d.historical),
          String(d.predicted ?? ""),
          String(d.optimistic ?? ""),
          String(d.conservative ?? ""),
        ]);
        downloadCSV("Enrollment_Forecast.csv", headers, rows);
        push({
          title: "Export Ready",
          message: "Enrollment Forecast CSV exported.",
          severity: "info",
        });
        return;
      }

      if (activeTab === "recommendations") {
        const headers = ["Title", "Reason", "ConfidencePct", "Related"];
        const top = planningRecommendations
          .slice()
          .sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0));
        const rows = top.map((r: any) => [
          r.title ?? "",
          r.description ?? r.rationale ?? "",
          String(Math.round(r.confidence ?? 0)),
          r.impact ?? "",
        ]);
        downloadCSV("Recommendations.csv", headers, rows);
        push({ title: "Export Ready", message: "Recommendations CSV exported.", severity: "info" });
        return;
      }

      if (activeTab === "risk_assessment") {
        const headers = ["Department", "Low", "Medium", "High", "Total"];
        const rows = (risk ?? []).map((r: RiskHeatmapRow) => [
          r.department,
          String(r.low ?? 0),
          String(r.medium ?? 0),
          String(r.high ?? 0),
          String((r.low ?? 0) + (r.medium ?? 0) + (r.high ?? 0)),
        ]);
        downloadCSV("Risk_Assessment.csv", headers, rows);
        push({ title: "Export Ready", message: "Risk CSV exported.", severity: "info" });
        return;
      }

      if (activeTab === "retention") {
        const headers = ["Term", "Observed Retention %", "Predicted Retention %"];
        const rows = retentionTrend.map((t: RetentionTrendRow) => [
          t.term,
          String(t.retention),
          String(t.predicted),
        ]);
        const avgRetention = retentionTrend.length
          ? Math.round(
              retentionTrend.reduce((s: number, t: RetentionTrendRow) => s + t.retention, 0) /
                retentionTrend.length,
            )
          : 0;
        const highRisk = employees.filter(
          (e) => e.retentionRisk === "high" && e.status !== "inactive",
        ).length;
        rows.push(
          ["", "", ""],
          ["SUMMARY", "Avg Retention Rate", `${avgRetention}%`],
          ["SUMMARY", "Turnover Rate (proxy)", `${clamp(100 - avgRetention, 0, 100)}%`],
          ["SUMMARY", "High-Risk Teachers", String(highRisk)],
          ["SUMMARY", "Predicted Resignations", String(Math.round(highRisk * 0.35))],
        );
        downloadCSV("Teacher_Retention_Trend.csv", headers, rows);
        push({
          title: "Export Ready",
          message: "Teacher Retention Trend CSV exported.",
          severity: "info",
        });
        return;
      }

      push({
        title: "Export Not Wired",
        message:
          "CSV export is wired for Executive, Enrollment Forecast, Recommendations, Risk, and Retention.",
        severity: "info",
      });
    } catch (e) {
      push({
        title: "Export Failed",
        message: "CSV export failed. See console for details.",
        severity: "info",
      });
      console.error(e);
    }
  };

  const deltaEnrollment = useMemo(() => {
    const enrollmentHistory = forecast3Year.filter(
      (d: EnrollmentForecastRow) => d.historical !== null,
    );
    const last3 = enrollmentHistory.slice(-3);
    if (last3.length !== 3) return 0;
    return (last3[2].historical ?? 0) - (last3[0].historical ?? 0);
  }, [forecast3Year]);

  const topRiskDepts = useMemo(() => {
    return (risk ?? [])
      .map((r: RiskHeatmapRow) => ({ ...r, total: r.low + r.medium + r.high }))
      .sort((a: any, b: any) => b.high - a.high || b.total - a.total)
      .slice(0, 4);
  }, [risk]);

  const topWorkloadDepts = useMemo(() => {
    return (workload ?? [])
      .slice()
      .sort((a: any, b: any) => b.workload - a.workload)
      .slice(0, 4);
  }, [workload]);

  // ── Render functions for each report tab ──────────────────────────────────
  const renderExecutive = () => {
    const nextActions = planningRecommendations.slice(0, 3) as PlanningRecommendation[];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Total Students"
            value={kpis.totalStudents.toLocaleString()}
            icon={<Users />}
          />
          <KpiCard
            label="Total Teachers"
            value={kpis.totalTeachers.toLocaleString()}
            icon={<Users />}
          />
          <KpiCard
            label="Student-Teacher Ratio"
            value={kpis.studentTeacherRatio.toFixed(2)}
            hint={`Active teachers: ${kpis.activeTeachers}`}
          />
          <KpiCard
            label="Teacher Utilization Rate"
            value={metricPercent(kpis.utilizationRate)}
            hint="Avg workload (active)"
          />
          <KpiCard
            label="Average Teacher Performance"
            value={metricPercent(kpis.avgPerformance)}
            hint="Mock avg performance"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Teacher Retention Rate"
            value={metricPercent(kpis.teacherRetentionRate)}
            hint="Proxy from retention trend"
            icon={<HeartPulse />}
          />
          <KpiCard
            label="Turnover Rate"
            value={metricPercent(kpis.teacherTurnoverRate)}
            hint="100% - retention"
            icon={<HeartPulse />}
          />
          <KpiCard
            label="High-Risk Teachers"
            value={String(kpis.highRiskTeachers)}
            hint="Retention risk = high"
          />
        </div>
        <ChartCard
          title="Key Metrics Overview"
          description="Radar view of core workforce indicators (normalized to 0–100)."
          action={<Badge variant="outline">Snapshot</Badge>}
        >
          <ChartContainer
            config={{
              value: { label: "Current", color: "var(--chart-1)" },
              benchmark: { label: "Benchmark", color: "var(--chart-3)" },
            }}
            className="h-[320px] w-full"
          >
            <RadarChart
              data={[
                {
                  metric: "Enrollment",
                  value: clamp(kpis.totalStudents / 15, 0, 100),
                  benchmark: 75,
                },
                {
                  metric: "Staffing",
                  value: clamp(kpis.activeTeachers * 2.2, 0, 100),
                  benchmark: 70,
                },
                { metric: "Utilization", value: kpis.utilizationRate, benchmark: 80 },
                { metric: "Performance", value: kpis.avgPerformance, benchmark: 75 },
                { metric: "Retention", value: kpis.teacherRetentionRate, benchmark: 85 },
                {
                  metric: "Risk Mgmt",
                  value: clamp(100 - kpis.highRiskTeachers * 5, 0, 100),
                  benchmark: 90,
                },
              ]}
              margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar
                name="Current"
                dataKey="value"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.25}
              />
              <Radar
                name="Benchmark"
                dataKey="benchmark"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.1}
                strokeDasharray="4 4"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ChartContainer>
        </ChartCard>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="What will happen?"
            description="Next-year outlook (model forecast)."
            action={<Badge variant="outline">Forecast</Badge>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Projected Enrollment (Next Year)
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {kpis.projectedEnrollmentNextYear.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Projected Staffing Gap
                </p>
                <p
                  className={`mt-2 text-2xl font-semibold tabular-nums ${kpis.projectedStaffingGap > 0 ? "text-destructive" : "text-emerald-600"}`}
                >
                  {Math.round(kpis.projectedStaffingGap).toLocaleString()} teachers
                </p>
              </div>
            </div>
          </ChartCard>
          <ChartCard
            title="What should we do next?"
            description="Top system recommendations."
            action={<Badge variant="outline">Action</Badge>}
          >
            {nextActions.length ? (
              nextActions.map((r: any, idx: number) => (
                <div key={r.id ?? idx} className="rounded-lg border p-3 mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {r.title ?? r.action ?? `Recommendation #${idx + 1}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.reason ?? r.description ?? ""}
                      </p>
                    </div>
                    <Badge variant={r.confidence >= 85 ? "secondary" : "outline"}>
                      {Math.round(r.confidence ?? 0)}% conf.
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No recommendations available.</div>
            )}
          </ChartCard>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="What happened?"
            description="Signals from recent enrollment and workforce risk."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Enrollment change (last 3 points)</p>
                <p
                  className={`text-sm font-semibold ${deltaEnrollment >= 0 ? "text-emerald-600" : "text-destructive"}`}
                >
                  {deltaEnrollment >= 0 ? "+" : ""}
                  {deltaEnrollment.toLocaleString()} students
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">High-risk departments (top)</p>
                <p className="text-sm font-semibold text-destructive">
                  {topRiskDepts.reduce((s: number, d: any) => s + d.high, 0)} high
                </p>
              </div>
            </div>
          </ChartCard>
          <ChartCard
            title="Where to focus (top drivers)"
            description="Departments to investigate first (risk + workload)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Highest retention risk
                </p>
                {topRiskDepts.map((d: any) => (
                  <div key={d.department} className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-sm">{d.department}</p>
                    <p className="text-sm font-semibold text-destructive">{d.high} high</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Highest workload utilization
                </p>
                {topWorkloadDepts.map((d: any) => (
                  <div key={d.department} className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-sm">{d.department}</p>
                    <p
                      className={`text-sm font-semibold ${d.workload >= 90 ? "text-destructive" : d.workload >= 75 ? "text-amber-600" : "text-muted-foreground"}`}
                    >
                      {d.workload}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    );
  };

  const renderEnrollmentForecast = () => {
    const teachersNeeded = enrollmentSummary?.teachersNeededYear3 ?? 0;
    const deficit = enrollmentSummary?.teachersDeficit ?? 0;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Current Enrollment"
            value={(enrollmentSummary?.currentEnrollment ?? 0).toLocaleString()}
            icon={<TrendingUp />}
          />
          <KpiCard
            label="Projected Next Year"
            value={(enrollmentSummary?.projectedYear1 ?? 0).toLocaleString()}
            hint={`YoY growth ${enrollmentSummary?.growthPercentage ?? 0}%`}
          />
          <KpiCard
            label="Projected Staffing Gap"
            value={Math.round(deficit).toLocaleString()}
            hint="Teachers needed proxy"
          />
        </div>
        <ChartCard
          title="3-Year Enrollment Forecast"
          description={`Historical + predicted enrollment for ${currentYear + 1}–${currentYear + 3} (confidence: ${enrollmentSummary?.confidence ?? "—"}%)`}
          action={<Badge variant="outline">Decision-ready</Badge>}
        >
          <HistoricalForecastTrend forecast={forecast3Year} />
        </ChartCard>
        <ChartCard
          title="Decision: How many teachers need to be hired?"
          description="Based on forecast teachersNeeded (year 3)."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Year 3 Teachers Needed
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{teachersNeeded}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Staffing Gap Proxy
              </p>
              <p
                className={`mt-2 text-3xl font-semibold tabular-nums ${deficit > 0 ? "text-destructive" : "text-emerald-600"}`}
              >
                {Math.round(deficit).toLocaleString()}
              </p>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderWorkforceAllocation = () => {
    const activeTeachers = employees.filter((e) => e.status !== "inactive");
    const overloaded = activeTeachers.filter((e) => e.workload > 90);
    const balanced = activeTeachers.filter((e) => e.workload >= 60 && e.workload <= 90);
    const underutilized = activeTeachers.filter((e) => e.workload < 60);
    const workloadChartData = [...(workload ?? [])].sort(
      (a: WorkloadByDeptRow, b: WorkloadByDeptRow) => b.workload - a.workload,
    );
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Overloaded Teachers"
            value={String(overloaded.length)}
            hint="workload > 90%"
            icon={<Activity />}
          />
          <KpiCard
            label="Underutilized Teachers"
            value={String(underutilized.length)}
            hint="workload < 60%"
            icon={<Activity />}
          />
          <KpiCard
            label="Balanced Teachers"
            value={String(balanced.length)}
            hint="60% – 90%"
            icon={<Activity />}
          />
        </div>
        <ChartCard
          title="Workload distribution (by department)"
          description="Bar chart showing workload percentage per department."
          action={<Badge variant="outline">Visual</Badge>}
        >
          <ChartContainer
            config={{ workload: { label: "Workload %", color: "var(--chart-1)" } }}
            className="h-[300px] w-full"
          >
            <BarChart data={workloadChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="department" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                {workloadChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.workload >= 90
                        ? "var(--destructive)"
                        : entry.workload >= 75
                          ? "var(--chart-4)"
                          : entry.workload >= 60
                            ? "var(--chart-2)"
                            : "var(--chart-3)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    );
  };

  const renderRetention = () => {
    const retentionAvg = retentionTrend.length
      ? retentionTrend.reduce((s: number, t: RetentionTrendRow) => s + t.retention, 0) /
        retentionTrend.length
      : 0;
    const turnoverProxy = 100 - retentionAvg;
    const highRisk = employees.filter(
      (e) => e.retentionRisk === "high" && e.status !== "inactive",
    ).length;
    const counts = {
      low: employees.filter((e) => e.status !== "inactive" && e.retentionRisk === "low").length,
      medium: employees.filter((e) => e.status !== "inactive" && e.retentionRisk === "medium")
        .length,
      high: employees.filter((e) => e.status !== "inactive" && e.retentionRisk === "high").length,
    };
    const retentionPieData = [
      { name: "Low Risk", value: counts.low, fill: "var(--chart-3)" },
      { name: "Medium Risk", value: counts.medium, fill: "var(--chart-4)" },
      { name: "High Risk", value: counts.high, fill: "var(--destructive)" },
    ];
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Retention Rate"
            value={metricPercent(retentionAvg)}
            hint="Avg over trend"
            icon={<HeartPulse />}
          />
          <KpiCard
            label="Turnover Rate"
            value={metricPercent(turnoverProxy)}
            hint="100% - retention"
            icon={<HeartPulse />}
          />
          <KpiCard
            label="Predicted Resignations"
            value={String(Math.round(highRisk * 0.35))}
            hint="Risk proxy"
            icon={<ShieldAlert />}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Retention trend"
            description="Observed vs predicted retention probability proxy."
            action={
              retentionTrend?.length ? (
                <Badge variant="outline" className="gap-1.5">
                  <Database className="h-3 w-3" />
                  CSV Data
                </Badge>
              ) : undefined
            }
          >
            <ChartContainer
              config={{
                retention: { label: "Retention %", color: "var(--chart-1)" },
                predicted: { label: "Predicted", color: "var(--chart-3)" },
              }}
              className="h-[320px] w-full"
            >
              <RetentionChart data={retentionTrend} />
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Retention risk distribution"
            description="Pie chart of teacher risk categories."
          >
            <ChartContainer
              config={{
                low: { label: "Low Risk", color: "var(--chart-3)" },
                medium: { label: "Medium Risk", color: "var(--chart-4)" },
                high: { label: "High Risk", color: "var(--destructive)" },
              }}
              className="h-[320px] w-full"
            >
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Pie
                  data={retentionPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {retentionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </ChartCard>
        </div>
        <ChartCard
          title="Risk categories"
          description="Distribution derived from employee retentionRisk values."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { k: "low", v: counts.low },
                { k: "medium", v: counts.medium },
                { k: "high", v: counts.high },
              ] as const
            ).map((x) => (
              <div key={x.k} className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {x.k.toUpperCase()} Risk
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{x.v}</p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderPerformance = () => {
    const avgPerf = performanceScatter.length
      ? performanceScatter.reduce((s: number, p) => s + p.performance, 0) /
        performanceScatter.length
      : 0;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Performance Rating"
            value={metricPercent(avgPerf)}
            hint="Avg performance (mock)"
            icon={<Star />}
          />
          <KpiCard label="Attendance" value="N/A" hint="Placeholder" />
          <KpiCard label="Training Hours" value="N/A" hint="Placeholder" />
        </div>
        <ChartCard
          title="Performance vs Workload"
          description="Scatter plot: x=workload %, y=performance %."
          action={<Badge variant="outline">Insights</Badge>}
        >
          <ChartContainer
            config={{
              workload: { label: "Workload", color: "var(--chart-1)" },
              performance: { label: "Performance", color: "var(--chart-2)" },
            }}
            className="h-[340px] w-full"
          >
            <PerformanceScatter data={performanceScatter} />
          </ChartContainer>
        </ChartCard>
      </div>
    );
  };

  const renderStrandAnalysis = () => {
    const deptWorkload: Record<string, number> = (workload ?? []).reduce(
      (acc: Record<string, number>, d: WorkloadByDeptRow) => {
        acc[d.department] = d.workload;
        return acc;
      },
      {},
    );
    const strandOrder = ["STEM", "ABM", "HUMSS", "GAS", "ICT", "TVL", "HE", "Arts and Design"];
    const deptToStrand: Record<string, string> = {
      Mathematics: "STEM",
      Sciences: "STEM",
      Languages: "HUMSS",
      Humanities: "HUMSS",
      Arts: "Arts and Design",
      PE: "TVL",
    };
    const strandScore = strandOrder.map((s) => {
      const related = Object.entries(deptToStrand)
        .filter(([, v]) => v === s)
        .map(([k]) => k);
      const scores = related.map((dep) => deptWorkload[dep] ?? 0);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { strand: s, workload: Math.round(avg) };
    });
    const lowest = strandScore.slice().sort((a, b) => a.workload - b.workload)[0];
    return (
      <div className="space-y-6">
        <ChartCard
          title="Strand staffing pressure"
          description="Bar chart of estimated workload pressure per strand."
          action={<Badge variant="outline">Visual</Badge>}
        >
          <ChartContainer
            config={{ workload: { label: "Workload %", color: "var(--chart-2)" } }}
            className="h-[320px] w-full"
          >
            <BarChart data={strandScore} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="strand" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                {strandScore.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.workload >= 90
                        ? "var(--destructive)"
                        : entry.workload >= 75
                          ? "var(--chart-4)"
                          : entry.workload >= 50
                            ? "var(--chart-2)"
                            : "var(--chart-3)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard
          title="Decision: Which strand lacks teachers?"
          description="Lowest coverage proxy score."
          action={<Badge variant="outline">Actionable</Badge>}
        >
          <div className="rounded-lg border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lacking teachers (estimate)
            </p>
            <p className="mt-2 text-2xl font-semibold">{lowest?.strand ?? "—"}</p>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderRiskAssessment = () => {
    const totals = (risk ?? []).reduce(
      (acc: { low: number; medium: number; high: number }, r: RiskHeatmapRow) => {
        acc.low += r.low;
        acc.medium += r.medium;
        acc.high += r.high;
        return acc;
      },
      { low: 0, medium: 0, high: 0 },
    );
    const stackedBarData = (risk ?? []).map((r: RiskHeatmapRow) => ({
      department: r.department,
      low: r.low,
      medium: r.medium,
      high: r.high,
    }));
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Low Risk" value={String(totals.low)} hint="Teachers" />
          <KpiCard label="Medium Risk" value={String(totals.medium)} hint="Teachers" />
          <KpiCard label="High Risk" value={String(totals.high)} hint="Teachers" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Risk distribution"
            description="Overall low/medium/high risk breakdown."
          >
            <ChartContainer
              config={{
                low: { label: "Low", color: "var(--chart-3)" },
                medium: { label: "Medium", color: "var(--chart-4)" },
                high: { label: "High", color: "var(--destructive)" },
              }}
              className="h-[300px] w-full"
            >
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Pie
                  data={[
                    { name: "Low", value: totals.low, fill: "var(--chart-3)" },
                    { name: "Medium", value: totals.medium, fill: "var(--chart-4)" },
                    { name: "High", value: totals.high, fill: "var(--destructive)" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {["var(--chart-3)", "var(--chart-4)", "var(--destructive)"].map((c, i) => (
                    <Cell key={`cell-${i}`} fill={c} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Risk by department (stacked)"
            description="Stacked bar chart showing risk levels per department."
          >
            <ChartContainer
              config={{
                low: { label: "Low", color: "var(--chart-3)" },
                medium: { label: "Medium", color: "var(--chart-4)" },
                high: { label: "High", color: "var(--destructive)" },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={stackedBarData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="department" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="low" stackId="risk" fill="var(--chart-3)" />
                <Bar dataKey="medium" stackId="risk" fill="var(--chart-4)" />
                <Bar
                  dataKey="high"
                  stackId="risk"
                  fill="var(--destructive)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </div>
      </div>
    );
  };

  const renderSkillGap = () => {
    const trainingActions = planningRecommendations
      .filter((r: any) => typeof r.title === "string" && r.title.toLowerCase().includes("train"))
      .slice(0, 8);
    const displayChartData =
      trainingActions.length > 0
        ? trainingActions.map((r: any, idx: number) => ({
            name: (r.title ?? `#${idx + 1}`).substring(0, 20),
            confidence: Math.round(r.confidence ?? 0),
          }))
        : planningRecommendations
            .slice(0, 8)
            .map((r: any, idx: number) => ({
              name: (r.title ?? `#${idx + 1}`).substring(0, 20),
              confidence: Math.round(r.confidence ?? 0),
            }));
    return (
      <div className="space-y-6">
        <ChartCard
          title="Training priority confidence scores"
          description="Bar chart showing confidence levels for recommended training actions."
          action={<Badge variant="outline">Visual</Badge>}
        >
          <ChartContainer
            config={{ confidence: { label: "Confidence %", color: "var(--chart-1)" } }}
            className="h-[320px] w-full"
          >
            <BarChart data={displayChartData} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={9}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
                {displayChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.confidence >= 85
                        ? "var(--chart-3)"
                        : entry.confidence >= 70
                          ? "var(--chart-2)"
                          : "var(--chart-4)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    );
  };

  const renderSchedulingEfficiency = () => {
    const totalSlots = schedule.length;
    const conflictSlots = schedule.filter((s: any) => s.conflict).length;
    const conflictRate = totalSlots > 0 ? Math.round((conflictSlots / totalSlots) * 100) : 0;
    const teacherSlotCount: Record<string, number> = {};
    schedule.forEach((s: any) => {
      teacherSlotCount[s.employeeName] = (teacherSlotCount[s.employeeName] || 0) + 1;
    });
    const teachersByLoad = Object.entries(teacherSlotCount)
      .map(([name, slots]) => ({ name: name.split(" ")[0], slots }))
      .sort((a, b) => b.slots - a.slots)
      .slice(0, 8);
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Scheduling Conflicts"
            value={String(conflictSlots)}
            hint={`${conflictRate}% conflict rate`}
            icon={conflictSlots > 0 ? <AlertTriangle /> : <CheckCircle />}
          />
          <KpiCard
            label="Total Schedule Slots"
            value={String(totalSlots)}
            hint="All teacher slots"
          />
          <KpiCard
            label="Unique Rooms Used"
            value={String(new Set(schedule.map((s: any) => s.room)).size)}
            hint="Rooms"
          />
        </div>
        <ChartCard
          title="Teacher schedule load"
          description="Number of scheduled slots per teacher."
        >
          <ChartContainer
            config={{ slots: { label: "Slots", color: "var(--chart-1)" } }}
            className="h-[300px] w-full"
          >
            <BarChart data={teachersByLoad} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="slots" radius={[4, 4, 0, 0]} fill="var(--chart-1)" />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    );
  };

  const renderRecommendations = () => {
    const top = planningRecommendations
      .slice()
      .sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0));
    const confidenceChartData = top
      .slice(0, 10)
      .map((r: any, idx: number) => ({
        name: (r.title ?? `#${idx + 1}`).substring(0, 18),
        confidence: Math.round(r.confidence ?? 0),
      }));
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard label="Total Recommendations" value={String(planningRecommendations.length)} />
          <KpiCard
            label="High Confidence"
            value={String(
              planningRecommendations.filter((r: any) => (r.confidence ?? 0) >= 85).length,
            )}
            hint="≥ 85%"
          />
          <KpiCard
            label="Medium Confidence"
            value={String(
              planningRecommendations.filter(
                (r: any) => (r.confidence ?? 0) >= 70 && (r.confidence ?? 0) < 85,
              ).length,
            )}
            hint="70–84%"
          />
          <KpiCard
            label="Low Confidence"
            value={String(
              planningRecommendations.filter((r: any) => (r.confidence ?? 0) < 70).length,
            )}
            hint="< 70%"
          />
        </div>
        <ChartCard
          title="Recommendation confidence scores"
          description="Bar chart of top recommendation confidence levels."
        >
          <ChartContainer
            config={{ confidence: { label: "Confidence %", color: "var(--chart-1)" } }}
            className="h-[320px] w-full"
          >
            <BarChart
              data={confidenceChartData}
              margin={{ top: 10, right: 10, bottom: 40, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={9}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
                {confidenceChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.confidence >= 85
                        ? "var(--chart-3)"
                        : entry.confidence >= 70
                          ? "var(--chart-2)"
                          : "var(--chart-4)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    );
  };

  const renderPredictive = () => {
    const expectedEnrollmentIncrease = enrollmentSummary?.totalGrowth ?? 0;
    const expectedResignations = Math.round(
      employees.filter((e) => e.retentionRisk === "high").length * 0.35,
    );
    const highRiskStaff = employees.filter(
      (e) => e.retentionRisk === "high" && e.status !== "inactive",
    ).length;
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Expected Enrollment Increase"
            value={`+${expectedEnrollmentIncrease.toLocaleString()}`}
            hint="Forecast totalGrowth"
            icon={<TrendingUp />}
          />
          <KpiCard
            label="Expected Resignations"
            value={expectedResignations.toLocaleString()}
            hint="High-risk proxy"
            icon={<HeartPulse />}
          />
          <KpiCard
            label="High-Risk Staff"
            value={highRiskStaff.toLocaleString()}
            hint="Retention risk = high"
            icon={<ShieldAlert />}
          />
        </div>
        <ChartCard
          title="Combined outlook"
          description="Enrollment confidence + risk distribution."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-h-[260px]">
              <ChartContainer
                config={{
                  optimistic: { label: "Optimistic", color: "var(--chart-2)" },
                  conservative: { label: "Conservative", color: "var(--chart-3)" },
                  predicted: { label: "Predicted", color: "var(--chart-1)" },
                }}
                className="h-[260px] w-full"
              >
                <EnrollmentConfidence forecast={forecast3Year} />
              </ChartContainer>
            </div>
            <div className="min-h-[260px]">
              <ChartContainer
                config={{
                  low: { label: "Low", color: "var(--chart-1)" },
                  medium: { label: "Medium", color: "var(--chart-2)" },
                  high: { label: "High", color: "var(--chart-3)" },
                }}
                className="h-full w-full"
              >
                <RiskPie risk={risk} />
              </ChartContainer>
            </div>
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderAudit = () => {
    const actionCount: Record<string, number> = {};
    auditLogs.forEach((log: any) => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    });
    const actionDistribution = Object.entries(actionCount)
      .map(([action, count]) => ({ action: action.replace(/_/g, " "), count }))
      .sort((a, b) => b.count - a.count);
    const recentLogs = auditLogs.slice(0, 10);
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total Audit Logs"
            value={String(auditLogs.length)}
            hint="Recorded actions"
            icon={<ClipboardCheck />}
          />
          <KpiCard
            label="Unique Actors"
            value={String(
              Object.keys(
                auditLogs.reduce((acc: Record<string, number>, l: any) => {
                  acc[l.actor.split("@")[0]] = 1;
                  return acc;
                }, {}),
              ).length,
            )}
            hint="Users active"
          />
          <KpiCard
            label="Action Types"
            value={String(Object.keys(actionCount).length)}
            hint="Distinct actions"
          />
        </div>
        <ChartCard
          title="Actions by type"
          description="Bar chart of audit log action distribution."
        >
          <ChartContainer
            config={{ count: { label: "Count", color: "var(--chart-1)" } }}
            className="h-[300px] w-full"
          >
            <BarChart
              data={actionDistribution}
              margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="action" stroke="var(--muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {actionDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
        <ChartCard title="Recent activity" description="Latest audit log entries.">
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor} · {log.target} · {new Date(log.at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{log.ip}</Badge>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    );
  };

  const renderActive = () => {
    switch (activeTab) {
      case "executive":
        return renderExecutive();
      case "enrollment_forecast":
        return renderEnrollmentForecast();
      case "workforce_allocation":
        return renderWorkforceAllocation();
      case "retention":
        return renderRetention();
      case "performance":
        return renderPerformance();
      case "strand_analysis":
        return renderStrandAnalysis();
      case "risk_assessment":
        return renderRiskAssessment();
      case "skill_gap":
        return renderSkillGap();
      case "scheduling_efficiency":
        return renderSchedulingEfficiency();
      case "recommendations":
        return renderRecommendations();
      case "predictive":
        return renderPredictive();
      case "audit":
        return renderAudit();
      default:
        return renderExecutive();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Decision-maker reports: what happened, why, what will happen, and what to do next."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveTab(r.id)}
            className={
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/60 hover:shadow-sm " +
              (activeTab === r.id ? "border-primary bg-primary/5 shadow-sm" : "bg-card")
            }
          >
            <div
              className={
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md " +
                (activeTab === r.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground")
              }
            >
              {r.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{r.description}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">
                {REPORTS.find((r) => r.id === activeTab)?.label}
              </p>
              <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeTab === "executive" ? "Executive" : "Analytics"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={false}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} disabled={false}>
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        {hasAnyError ? (
          <div className="p-5 space-y-3">
            <div className="text-sm font-semibold text-destructive">
              Some report data failed to load
            </div>
            <div className="text-xs text-muted-foreground">
              {errorMessages.length ? errorMessages.join(" | ") : "Check console for details."}
            </div>
          </div>
        ) : isLoadingAny ? (
          <div className="p-5 space-y-4">
            <ChartSkeleton />
            <TableSkeleton />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportId)}>
            <TabsContent value="executive">{renderExecutive()}</TabsContent>
            <TabsContent value="enrollment_forecast">{renderEnrollmentForecast()}</TabsContent>
            <TabsContent value="workforce_allocation">{renderWorkforceAllocation()}</TabsContent>
            <TabsContent value="retention">{renderRetention()}</TabsContent>
            <TabsContent value="performance">{renderPerformance()}</TabsContent>
            <TabsContent value="strand_analysis">{renderStrandAnalysis()}</TabsContent>
            <TabsContent value="risk_assessment">{renderRiskAssessment()}</TabsContent>
            <TabsContent value="skill_gap">{renderSkillGap()}</TabsContent>
            <TabsContent value="scheduling_efficiency">{renderSchedulingEfficiency()}</TabsContent>
            <TabsContent value="recommendations">{renderRecommendations()}</TabsContent>
            <TabsContent value="predictive">{renderPredictive()}</TabsContent>
            <TabsContent value="audit">{renderAudit()}</TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
