import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService } from "@/services";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ScatterChart, Scatter, Legend,
} from "recharts";
import { KpiCard } from "@/components/shared/kpi-card";
import { Brain, Target, Zap } from "lucide-react";

export const Route = createFileRoute("/app/predictive")({
  head: () => ({ meta: [{ title: "Predictive Analytics · Workforce IQ" }] }),
  component: Page,
});

const ts = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 };

function Page() {
  const enrollment = useQuery({ queryKey: ["enrollment"], queryFn: analyticsService.enrollment });
  const retention = useQuery({ queryKey: ["retention"], queryFn: analyticsService.retention });
  const scatter = useQuery({ queryKey: ["perfScatter"], queryFn: analyticsService.performanceScatter });

  return (
    <div className="space-y-6">
      <PageHeader title="Predictive Analytics" description="ML-driven forecasts for enrollment, retention and performance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Model Accuracy" value="94.2%" delta={1.4} icon={<Target className="h-4 w-4" />} />
        <KpiCard label="Active Models" value="6" hint="2 retraining" icon={<Brain className="h-4 w-4" />} />
        <KpiCard label="Latency (p95)" value="142ms" delta={-8} icon={<Zap className="h-4 w-4" />} />
      </div>

      <ChartCard title="Enrollment Forecast" description="Actual + 4-month projection">
        {enrollment.isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={enrollment.data}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={ts} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="actual" stroke="var(--chart-1)" fill="url(#gE)" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

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
