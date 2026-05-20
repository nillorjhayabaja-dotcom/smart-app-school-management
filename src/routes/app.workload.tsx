import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { employeeService } from "@/services";
import { KpiCard } from "@/components/shared/kpi-card";
import { Activity, AlertTriangle, Scale } from "lucide-react";

export const Route = createFileRoute("/app/workload")({
  head: () => ({ meta: [{ title: "Workload Distribution · Workforce IQ" }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });

  const overloaded = (data ?? []).filter((e) => e.workload > 90);
  const balanced = (data ?? []).filter((e) => e.workload >= 60 && e.workload <= 90);
  const under = (data ?? []).filter((e) => e.workload < 60);

  return (
    <div className="space-y-6">
      <PageHeader title="Dynamic Workload Distribution" description="Visualize and rebalance teaching loads in real time." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Overloaded" value={overloaded.length} icon={<AlertTriangle className="h-4 w-4" />} hint=">90% capacity" />
        <KpiCard label="Balanced" value={balanced.length} icon={<Scale className="h-4 w-4" />} hint="60–90% capacity" />
        <KpiCard label="Underused" value={under.length} icon={<Activity className="h-4 w-4" />} hint="<60% capacity" />
      </div>

      <ChartCard title="Workload Distribution" description="Each row = one teacher">
        {isLoading ? <ChartSkeleton height={400} /> : (
          <div className="max-h-[460px] space-y-1.5 overflow-y-auto pr-2">
            {(data ?? []).sort((a,b) => b.workload - a.workload).map((e) => {
              const color = e.workload > 90 ? "bg-destructive" : e.workload >= 60 ? "bg-primary" : "bg-warning";
              return (
                <div key={e.id} className="grid grid-cols-[140px_1fr_48px] items-center gap-3 text-sm">
                  <p className="truncate text-xs text-muted-foreground">{e.name}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${e.workload}%` }} />
                  </div>
                  <span className="text-right text-xs font-medium tabular-nums">{e.workload}%</span>
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
