import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService, employeeService } from "@/services";
import { KpiCard } from "@/components/shared/kpi-card";
import { Network, Users, Briefcase } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/app/allocation")({
  head: () => ({ meta: [{ title: "Workforce Allocation · Workforce IQ" }] }),
  component: Page,
});

const ts = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

function Page() {
  const dist = useQuery({ queryKey: ["distribution"], queryFn: analyticsService.distribution });
  const workload = useQuery({ queryKey: ["workload"], queryFn: analyticsService.workload });
  const emps = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });

  return (
    <div className="space-y-6">
      <PageHeader title="Workforce Allocation" description="Plan teacher distribution and capacity across departments." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total FTE" value="46.8" icon={<Users className="h-4 w-4" />} hint="0.6 below target" />
        <KpiCard label="Departments" value="6" icon={<Briefcase className="h-4 w-4" />} />
        <KpiCard label="Avg Utilization" value="78%" delta={4} icon={<Network className="h-4 w-4" />} />
      </div>

      <ChartCard title="Capacity vs Workload" description="Per department">
        {workload.isLoading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={workload.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="department" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={ts} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="capacity" fill="var(--chart-3)" radius={[6,6,0,0]} />
              <Bar dataKey="workload" fill="var(--chart-1)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Headcount by Department" description={`${(emps.data ?? []).length} employees`}>
        {dist.isLoading ? <ChartSkeleton /> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dist.data?.map((d) => (
              <div key={d.name} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{d.name}</p>
                  <span className="text-2xl font-semibold tabular-nums">{d.value}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, d.value * 6)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
