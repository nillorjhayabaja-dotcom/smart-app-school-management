import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/skeletons";
import { recommendationService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X } from "lucide-react";

export const Route = createFileRoute("/app/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations · Workforce IQ" }] }),
  component: Page,
});

const impactColor = { low: "bg-muted text-muted-foreground", medium: "bg-warning/15 text-warning", high: "bg-destructive/15 text-destructive" };

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["recs"], queryFn: recommendationService.list });

  return (
    <div className="space-y-6">
      <PageHeader title="Recommendations" description="Prescriptive actions ranked by impact and confidence." />

      {isLoading ? <div className="grid gap-3 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div> : (
        <div className="grid gap-3">
          {data?.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{r.title}</h3>
                  <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                  <Badge variant="secondary" className={`capitalize ${impactColor[r.impact]}`}>{r.impact} impact</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${r.confidence * 100}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{Math.round(r.confidence * 100)}% confidence</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><X className="mr-1.5 h-4 w-4" />Dismiss</Button>
                <Button size="sm"><Check className="mr-1.5 h-4 w-4" />Apply</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
