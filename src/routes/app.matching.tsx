import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/skeletons";
import { employeeService } from "@/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Puzzle, Search } from "lucide-react";

export const Route = createFileRoute("/app/matching")({
  head: () => ({ meta: [{ title: "Skill Matching · Workforce IQ" }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["employees"], queryFn: employeeService.list });
  const [need, setNeed] = useState("Algebra");

  const ranked = (data ?? [])
    .map((e) => {
      const matches = e.skills.filter((s) => s.toLowerCase().includes(need.toLowerCase()));
      const score = matches.length * 30 + e.performance * 0.5 + (100 - e.workload) * 0.3;
      return { ...e, matches, score: Math.round(score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Skill-Based Matching" description="Rank teachers by competency match for a specific need." />

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Skill or subject needed</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. Calculus, ESL, Curriculum…" className="pl-9" />
            </div>
          </div>
          <Button><Puzzle className="mr-1.5 h-4 w-4" />Find matches</Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        {isLoading ? <div className="p-5"><TableSkeleton /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Rank</th><th>Teacher</th><th>Department</th><th>Skills</th><th>Workload</th><th className="text-right pr-5">Match Score</th></tr>
              </thead>
              <tbody>
                {ranked.map((e, i) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-semibold tabular-nums">#{i + 1}</td>
                    <td><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.email}</div></td>
                    <td className="text-muted-foreground">{e.department}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {e.skills.map((s) => (
                          <Badge key={s} variant="secondary" className={e.matches.includes(s) ? "bg-primary/15 text-primary" : ""}>{s}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="tabular-nums text-muted-foreground">{e.workload}%</td>
                    <td className="pr-5 text-right">
                      <span className="inline-flex items-center justify-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary tabular-nums">{e.score}</span>
                    </td>
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
