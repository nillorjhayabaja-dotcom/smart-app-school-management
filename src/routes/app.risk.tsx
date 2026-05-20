import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { CardSkeleton } from "@/components/shared/skeletons";
import { analyticsService, employeeService } from "@/services";
import { KpiCard } from "@/components/shared/kpi-card";
import { ShieldAlert, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/risk")({
  head: () => ({ meta: [{ title: "Risk Assessment · Workforce IQ" }] }),
  component: Page,
});

function Page() {
  const risk = useQuery({ queryKey: ["risk"], queryFn: analyticsService.risk });
  const emps = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });

  const high = (emps.data ?? []).filter((e) => e.retentionRisk === "high");
  const medium = (emps.data ?? []).filter((e) => e.retentionRisk === "medium");
  const low = (emps.data ?? []).filter((e) => e.retentionRisk === "low");

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Assessment" description="Retention and burnout risk across departments." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="High risk" value={high.length} icon={<ShieldAlert className="h-4 w-4" />} hint="needs attention" />
        <KpiCard label="Medium risk" value={medium.length} icon={<AlertCircle className="h-4 w-4" />} hint="monitor closely" />
        <KpiCard label="Low risk" value={low.length} icon={<ShieldCheck className="h-4 w-4" />} hint="healthy" />
      </div>

      <ChartCard title="Risk Heatmap" description="Risk counts by department and severity">
        {risk.isLoading ? <CardSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">Department</th><th>Low</th><th>Medium</th><th>High</th><th>Total</th></tr>
              </thead>
              <tbody>
                {risk.data?.map((r) => {
                  const total = r.low + r.medium + r.high;
                  return (
                    <tr key={r.department} className="border-t">
                      <td className="py-3 font-medium">{r.department}</td>
                      {(["low","medium","high"] as const).map((k) => {
                        const v = r[k];
                        const max = k === "low" ? 12 : k === "medium" ? 8 : 5;
                        const intensity = Math.min(1, v / max);
                        const bg = k === "low" ? `color-mix(in oklab, var(--success) ${intensity * 100}%, transparent)`
                          : k === "medium" ? `color-mix(in oklab, var(--warning) ${intensity * 100}%, transparent)`
                          : `color-mix(in oklab, var(--destructive) ${intensity * 100}%, transparent)`;
                        return (<td key={k}><div className="inline-flex h-9 w-14 items-center justify-center rounded-md font-semibold" style={{ background: bg }}>{v}</div></td>);
                      })}
                      <td className="tabular-nums text-muted-foreground">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      <ChartCard title="High-Risk Teachers" description="Flagged for intervention">
        {emps.isLoading ? <CardSkeleton /> : (
          <ul className="divide-y">
            {high.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.department} · workload {e.workload}% · perf {e.performance}</p>
                </div>
                <Badge variant="secondary" className="bg-destructive/15 text-destructive">High risk</Badge>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
