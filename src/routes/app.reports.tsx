import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { reportsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileBarChart2, Plus } from "lucide-react";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports · Workforce IQ" }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: reportsService.list });

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generated forecasts and operational reports."
        actions={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Generate</Button>}
      />
      <div className="rounded-xl border bg-card">
        {isLoading ? <div className="p-5"><TableSkeleton /></div> : (
          <ul className="divide-y">
            {data?.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <FileBarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.size} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.type}</Badge>
                  <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" />Download</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
