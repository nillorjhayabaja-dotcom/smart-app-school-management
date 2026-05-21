import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { CardSkeleton } from "@/components/shared/skeletons";
import { schedulingService } from "@/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CalendarPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Only hr_admin and super_admin can manage scheduling
const checkAccess = (ctx: any) => {
  if (ctx.auth?.user?.role && !["hr_admin", "super_admin"].includes(ctx.auth.user.role)) {
    throw redirect({ to: "/app" });
  }
};

export const Route = createFileRoute("/app/scheduling")({
  head: () => ({ meta: [{ title: "Scheduling · Workforce IQ" }] }),
  beforeLoad: ({ context }: any) => checkAccess(context),
  component: Page,
});

const days = ["Mon","Tue","Wed","Thu","Fri"];
const hours = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00"];

function Page() {
  const { data, isLoading } = useQuery({ queryKey: ["schedule"], queryFn: schedulingService.list });

  const conflicts = (data ?? []).filter((s) => s.conflict);

  return (
    <div className="space-y-6">
      <PageHeader title="Flexible Scheduling" description="Weekly calendar, conflict detection, and teacher preferences."
        actions={<Button size="sm"><CalendarPlus className="mr-1.5 h-4 w-4" />New Class</Button>}
      />

      {conflicts.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
          <div className="flex-1">
            <p className="font-medium">{conflicts.length} scheduling conflict{conflicts.length !== 1 ? "s" : ""} detected</p>
            <p className="text-xs text-muted-foreground">Review and resolve overlapping rooms or teacher double-bookings.</p>
          </div>
          <Button size="sm" variant="outline">Review</Button>
        </div>
      )}

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <ChartCard title="Weekly Schedule" description="Mon–Fri · 8:00–15:00">
            {isLoading ? <CardSkeleton /> : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[720px] grid-cols-[60px_repeat(5,1fr)] gap-px overflow-hidden rounded-md border bg-border">
                  <div className="bg-card" />
                  {days.map((d) => <div key={d} className="bg-card px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>)}
                  {hours.map((h) => (
                    <div key={h} className="contents">
                      <div className="bg-card px-2 py-3 text-xs text-muted-foreground">{h}</div>
                      {days.map((d) => {
                        const entry = data?.find((s) => s.day === d && s.start === h);
                        return (
                          <div key={d+h} className="min-h-[68px] bg-card p-1.5">
                            {entry && (
                              <div className={`h-full rounded-md p-2 text-xs ${entry.conflict ? "bg-destructive/15 border border-destructive/40" : "bg-primary/10 border border-primary/20"}`}>
                                <p className="truncate font-semibold text-foreground">{entry.subject}</p>
                                <p className="truncate text-muted-foreground">{entry.employeeName}</p>
                                <p className="truncate text-muted-foreground">{entry.room}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <ChartCard title="Teacher Preferences" description="Preferred days, hours and subjects">
            <ul className="divide-y">
              {(data ?? []).slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{s.employeeName}</p>
                    <p className="text-xs text-muted-foreground">Prefers {s.day} mornings · {s.subject}</p>
                  </div>
                  <Badge variant="secondary">Preferred</Badge>
                </li>
              ))}
            </ul>
          </ChartCard>
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <ChartCard title="Availability Management" description="Mark teachers' available days">
            <div className="grid gap-2">
              {(data ?? []).slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <p className="font-medium">{s.employeeName}</p>
                  <div className="flex gap-1.5">
                    {days.map((d) => (
                      <span key={d} className={`inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-medium ${d === s.day ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
