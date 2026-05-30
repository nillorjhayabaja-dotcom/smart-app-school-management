import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService } from "@/services";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ScatterChart, Scatter, Legend, ReferenceLine,
  ComposedChart, Bar,
} from "recharts";
import { KpiCard } from "@/components/shared/kpi-card";
import {
  Users, GraduationCap, AlertTriangle,
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

export const Route = createFileRoute("/app/predictive")({
  head: () => ({ meta: [{ title: "Predictive Analytics · Workforce IQ" }] }),
  component: Page,
});

const ts = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 };

const currentYear = new Date().getFullYear();

function Page() {
  const forecast3Year = useQuery({ queryKey: ["enrollmentForecast3Year"], queryFn: analyticsService.enrollmentForecast3Year });
  const summary = useQuery({ queryKey: ["enrollmentSummary"], queryFn: analyticsService.enrollmentSummary });
  const retention = useQuery({ queryKey: ["retention"], queryFn: analyticsService.retention });
  const scatter = useQuery({ queryKey: ["perfScatter"], queryFn: analyticsService.performanceScatter });

  const summaryData = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Forecast & Workforce Planning"
        description="3-year enrollment predictions, teacher-to-student ratio impact analysis, and workforce capacity metrics."
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Current Enrollment"
          value={summaryData?.currentEnrollment?.toLocaleString() ?? "—"}
          hint={`${summaryData?.currentEmployees} employees`}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <KpiCard
          label="Year 3 Projected"
          value={summaryData?.projectedYear3?.toLocaleString() ?? "—"}
          delta={summaryData?.growthPercentage}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          label="Current Ratio"
          value={`1:${summaryData?.currentRatio?.toFixed(1)}`}
          hint="PH standard: 1:36–1:40"
          icon={<Users className="h-4 w-4" />}
          className={summaryData && summaryData.currentRatio > 40 ? "border-orange-300" : ""}
        />
        <KpiCard
          label="Year 3 Ratio"
          value={`1:${summaryData?.projectedRatioYear3?.toFixed(1)}`}
          hint={summaryData?.teachersDeficit ? `${summaryData.teachersDeficit} teachers needed` : "Within standard"}
          icon={<AlertTriangle className="h-4 w-4" />}
          className={summaryData && summaryData.projectedRatioYear3 > 40 ? "border-destructive" : ""}
        />
      </div>

      {/* ── 3-Year Enrollment Forecast Chart ── */}
      <ChartCard
        title="3-Year Enrollment Forecast"
        description={`Historical data + predicted enrollment for ${currentYear + 1}–${currentYear + 3} (confidence: ${summaryData?.confidence ?? "—"}%)`}
      >
        {forecast3Year.isLoading ? <ChartSkeleton height={380} /> : (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={forecast3Year.data}>
              <defs>
                <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip
                contentStyle={ts}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    historical: "Actual Enrollment",
                    predicted: "Predicted",
                    optimistic: "Optimistic (+6%)",
                    conservative: "Conservative (−6%)",
                  };
                  return [value?.toLocaleString(), labels[name] || name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={currentYear}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{ value: "Now", position: "top", fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Area type="monotone" dataKey="historical" stroke="var(--chart-1)" fill="url(#gHist)" strokeWidth={2} connectNulls={false} name="historical" />
              <Area type="monotone" dataKey="optimistic" stroke="var(--chart-3)" fill="none" strokeWidth={1} strokeDasharray="3 3" connectNulls={false} name="optimistic" />
              <Area type="monotone" dataKey="conservative" stroke="var(--chart-4)" fill="none" strokeWidth={1} strokeDasharray="3 3" connectNulls={false} name="conservative" />
              <Area type="monotone" dataKey="predicted" stroke="var(--chart-2)" fill="url(#gPred)" strokeWidth={2.5} strokeDasharray="6 3" connectNulls={false} name="predicted" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Employee Count vs Enrollment Growth & Teacher-to-Student Ratio ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Enrollment vs Employee Count"
          description="Effect of enrollment growth with same employee count"
        >
          {forecast3Year.isLoading ? <ChartSkeleton height={300} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={forecast3Year.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => String(v)} />
                <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={ts}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      predicted: "Enrollment (Projected)",
                      employees: "Employee Count",
                      teachersNeeded: "Teachers Needed (1:38)",
                    };
                    return [value?.toLocaleString(), labels[name] || name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="predicted" name="teachersNeeded" fill="var(--chart-5)" opacity={0.4} radius={[2, 2, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="predicted" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} name="Enrollment (Projected)" />
                <Line yAxisId="right" type="monotone" dataKey="employees" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" name="Employee Count (Fixed)" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Teacher-to-Student Ratio Trend"
          description="PH DepEd standard: 1:36–1:40 (dashed lines)"
        >
          {forecast3Year.isLoading ? <ChartSkeleton height={300} /> : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={forecast3Year.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => String(v)} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  domain={[0, "auto"]}
                  label={{ value: "Students per Teacher", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={ts}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      teacherStudentRatio: "Actual Ratio",
                    };
                    return [`1:${value}`, labels[name] || name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={36} stroke="var(--chart-3)" strokeDasharray="4 4" label={{ value: "Min (1:36)", position: "insideTopRight", fontSize: 9, fill: "var(--chart-3)" }} />
                <ReferenceLine y={40} stroke="var(--destructive)" strokeDasharray="4 4" label={{ value: "Max (1:40)", position: "insideTopRight", fontSize: 9, fill: "var(--destructive)" }} />
                <Line
                  type="monotone"
                  dataKey="teacherStudentRatio"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isOverRatio = payload.teacherStudentRatio > 40;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={isOverRatio ? "var(--destructive)" : "var(--chart-1)"}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  name="teacherStudentRatio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Workforce Impact Analysis ── */}
      {summaryData && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Workforce Impact Analysis: What Happens If Employee Count Stays at {summaryData.currentEmployees}?
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ImpactCard
              label="Year 1 Projection"
              value={summaryData.projectedYear1.toLocaleString()}
              sublabel="students"
              trend={summaryData.projectedYear1 > summaryData.currentEnrollment ? "up" : "down"}
              delta={((summaryData.projectedYear1 - summaryData.currentEnrollment) / summaryData.currentEnrollment * 100).toFixed(1)}
              status="neutral"
            />
            <ImpactCard
              label="Year 2 Projection"
              value={summaryData.projectedYear2.toLocaleString()}
              sublabel="students"
              trend={summaryData.projectedYear2 > summaryData.currentEnrollment ? "up" : "down"}
              delta={((summaryData.projectedYear2 - summaryData.currentEnrollment) / summaryData.currentEnrollment * 100).toFixed(1)}
              status="warning"
            />
            <ImpactCard
              label="Year 3 Projection"
              value={summaryData.projectedYear3.toLocaleString()}
              sublabel="students"
              trend="up"
              delta={summaryData.growthPercentage.toFixed(1)}
              status="danger"
            />
            <ImpactCard
              label="Teachers Needed"
              value={summaryData.teachersNeededYear3.toString()}
              sublabel={`vs ${summaryData.currentEmployees} current`}
              trend="up"
              delta={`Deficit: ${summaryData.teachersDeficit}`}
              status={summaryData.teachersDeficit > 0 ? "danger" : "success"}
            />
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Key Finding:</strong> With enrollment projected to grow {summaryData.growthPercentage}% over 3 years while maintaining the current workforce of {summaryData.currentEmployees} employees,
            the student-to-teacher ratio will increase from <strong>1:{summaryData.currentRatio.toFixed(1)}</strong> to <strong>1:{summaryData.projectedRatioYear3.toFixed(1)}</strong>.
            {summaryData.projectedRatioYear3 > 40 && (
              <> This <span className="text-destructive font-semibold">exceeds the Philippine DepEd standard of 1:36–1:40</span>, indicating an urgent need for additional teaching staff.</>
            )}
          </div>
        </div>
      )}

      {/* ── Existing Analytics (Retention & Performance) ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Retention Trajectory" description="Predicted vs actual">
          {retention.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={retention.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="term" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[60, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={ts} />
                <Line type="monotone" dataKey="retention" stroke="var(--chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="predicted" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Workload vs Performance" description="Each point is a teacher">
          {scatter.isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" dataKey="workload" name="Workload" stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                <YAxis type="number" dataKey="performance" name="Performance" stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={ts} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={scatter.data} fill="var(--chart-1)" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

// ── Impact Card Sub-Component ──
function ImpactCard({
  label,
  value,
  sublabel,
  trend,
  delta,
  status,
}: {
  label: string;
  value: string;
  sublabel: string;
  trend: "up" | "down" | "neutral";
  delta: string;
  status: "success" | "warning" | "danger" | "neutral";
}) {
  const statusColors: Record<string, string> = {
    success: "border-green-200 bg-green-50/50",
    warning: "border-orange-200 bg-orange-50/50",
    danger: "border-red-200 bg-red-50/50",
    neutral: "border-border bg-card",
  };

  const trendColors: Record<string, string> = {
    up: "text-orange-600",
    down: "text-green-600",
    neutral: "text-muted-foreground",
  };

  return (
    <div className={`rounded-lg border p-3 ${statusColors[status]}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
      <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
        {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
        {trend === "down" && <ArrowDownRight className="h-3 w-3" />}
        {trend === "neutral" && <Minus className="h-3 w-3" />}
        {trend === "up" || trend === "down" ? `${delta}%` : delta}
      </div>
    </div>
  );
}