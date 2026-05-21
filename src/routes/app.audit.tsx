import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { auditService } from "@/services";
import { Badge } from "@/components/ui/badge";

// Only super_admin can view audit logs
const checkAccess = (ctx: any) => {
  if (ctx.auth?.user?.role !== "super_admin") {
    throw redirect({ to: "/app" });
  }
};

export const Route = createFileRoute("/app/audit")({
  head: () => ({ meta: [{ title: "Audit Logs · Workforce IQ" }] }),
  beforeLoad: ({ context }: any) => checkAccess(context),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: auditService.list });

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="System-wide activity history." />
      <div className="rounded-xl border bg-card">
        {isLoading ? <div className="p-5"><TableSkeleton /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th></tr>
              </thead>
              <tbody>
                {data?.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{new Date(l.at).toLocaleString()}</td>
                    <td className="font-medium">{l.actor}</td>
                    <td><Badge variant="secondary">{l.action}</Badge></td>
                    <td className="text-muted-foreground">{l.target}</td>
                    <td className="tabular-nums text-muted-foreground">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
