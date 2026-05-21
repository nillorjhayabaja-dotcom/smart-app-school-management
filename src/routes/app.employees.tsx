import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { EmptyState } from "@/components/shared/empty-state";
import { employeeService } from "@/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Download } from "lucide-react";

// Only hr_admin and super_admin can view employees
const checkAccess = (ctx: any) => {
  if (ctx.auth?.user?.role && !["hr_admin", "super_admin"].includes(ctx.auth.user.role)) {
    throw redirect({ to: "/app" });
  }
};

export const Route = createFileRoute("/app/employees")({
  head: () => ({ meta: [{ title: "Employees · Workforce IQ" }] }),
  beforeLoad: ({ context }: any) => checkAccess(context),
  component: Page,
});

const statusColor = { active: "bg-success/15 text-success", inactive: "bg-muted text-muted-foreground", on_leave: "bg-warning/15 text-warning" };
const riskColor = { low: "bg-success/15 text-success", medium: "bg-warning/15 text-warning", high: "bg-destructive/15 text-destructive" };

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");

  const filtered = useMemo(() => (data ?? []).filter((e) =>
    (dept === "all" || e.department === dept) &&
    (q === "" || e.name.toLowerCase().includes(q.toLowerCase()) || e.email.includes(q.toLowerCase()))
  ), [data, q, dept]);

  const departments = Array.from(new Set((data ?? []).map((e) => e.department)));

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Management" description="Search, filter, and manage your teaching workforce."
        actions={<><Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" />Export</Button><Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Add Employee</Button></>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-9" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-full sm:w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading ? <div className="p-5"><TableSkeleton /></div> : filtered.length === 0 ? (
          <EmptyState title="No employees match" description="Try clearing filters or searching for someone else." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Employee</th><th>Department</th><th>Role</th>
                  <th>Status</th><th>Workload</th><th>Performance</th><th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const init = e.name.split(" ").map((s) => s[0]).slice(0,2).join("").toUpperCase();
                  return (
                    <tr key={e.id} className="border-b last:border-0 transition-colors hover:bg-accent/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{init}</AvatarFallback></Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{e.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{e.department}</td>
                      <td className="text-muted-foreground">{e.role}</td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[e.status]}`}>{e.status.replace("_", " ")}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${e.workload}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">{e.workload}%</span>
                        </div>
                      </td>
                      <td className="tabular-nums">{e.performance}</td>
                      <td><Badge className={`capitalize ${riskColor[e.retentionRisk]}`} variant="secondary">{e.retentionRisk}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
