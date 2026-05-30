import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { CardSkeleton, ChartSkeleton } from "@/components/shared/skeletons";
import { analyticsService, recommendationService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Check, X, AlertTriangle, TrendingUp, Users, DollarSign,
  Building2, GraduationCap, Shield, ChevronRight, Clock, Zap,
  Target, Brain, ArrowRight, CheckCircle2, Circle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/app/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations · Workforce IQ" }] }),
  component: Page,
});

const impactColor = { low: "bg-muted text-muted-foreground", medium: "bg-warning/15 text-warning", high: "bg-destructive/15 text-destructive" };

const currentYear = new Date().getFullYear();

const priorityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <AlertTriangle className="h-4 w-4" />, label: "CRITICAL" },
  high: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: <TrendingUp className="h-4 w-4" />, label: "HIGH" },
  medium: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: <Target className="h-4 w-4" />, label: "MEDIUM" },
  low: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: <Shield className="h-4 w-4" />, label: "LOW" },
};

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  hiring: { label: "Hiring & Recruitment", icon: <Users className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  infrastructure: { label: "Infrastructure", icon: <Building2 className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-700" },
  budget: { label: "Budget Planning", icon: <DollarSign className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-700" },
  training: { label: "Training & Development", icon: <GraduationCap className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
  risk: { label: "Risk Mitigation", icon: <AlertTriangle className="h-4 w-4" />, color: "bg-rose-100 text-rose-700" },
};

const ts = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 12 };

function Page() {
  const { data: operationalRecs, isLoading: opsLoading } = useQuery({ queryKey: ["recs"], queryFn: recommendationService.list });
  const planningRecs = useQuery({ queryKey: ["planningRecommendations"], queryFn: analyticsService.planningRecommendations });
  const summary = useQuery({ queryKey: ["enrollmentSummary"], queryFn: analyticsService.enrollmentSummary });
  const forecast3Year = useQuery({ queryKey: ["enrollmentForecast3Year"], queryFn: analyticsService.enrollmentForecast3Year });

  const s = summary.data;
  const recs = planningRecs.data ?? [];

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedRecs = [...recs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Build workforce gap data for chart
  const gapData = forecast3Year.data?.filter((d) => d.year >= currentYear - 1).map((d) => ({
    year: String(d.year),
    enrollment: d.historical ?? d.predicted,
    teachersNeeded: d.teachersNeeded,
    employees: d.employees,
    surplus: d.employeeSurplus,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategic Workforce Planning"
        description="AI-powered automation engine — analyzes enrollment forecasts, workforce capacity, and generates actionable strategies."
      />

      {/* ── Automation Engine Status ── */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workforce Planning Engine</h3>
            <p className="text-xs text-muted-foreground">
              Analyzing {s?.currentEnrollment?.toLocaleString()} current enrollees → {s?.projectedYear3?.toLocaleString()} Year 3 projection
              · {s?.confidence}% model confidence · {recs.length} strategies generated
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-200">
            <Zap className="mr-1 h-3 w-3" /> ACTIVE
          </Badge>
        </div>
        {s && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Current" value={s.currentEnrollment.toLocaleString()} sub="enrollees" />
            <SummaryStat label="Year 3 Target" value={s.projectedYear3.toLocaleString()} sub="projected" accent />
            <SummaryStat label="Workforce" value={`${s.currentEmployees}`} sub="employees" />
            <SummaryStat
              label="Gap Analysis"
              value={s.teachersDeficit > 0 ? `${s.teachersDeficit} deficit` : "Balanced"}
              sub={s.teachersDeficit > 0 ? `need ${s.teachersNeededYear3} teachers` : "sufficient"}
              danger={s.teachersDeficit > 0}
            />
          </div>
        )}
      </div>

      {/* ── Workforce Capacity vs Demand Chart ── */}
      <ChartCard title="Workforce Capacity vs Enrollment Demand" description="Visualizing the growing gap between current staff and projected need">
        {forecast3Year.isLoading ? <ChartSkeleton height={260} /> : gapData ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={ts} />
              <Bar dataKey="employees" name="Current Staff" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="teachersNeeded" name="Teachers Needed (1:38)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </ChartCard>

      {/* ── Generated Strategic Strategies ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Auto-Generated Strategic Plan</h2>
        </div>

        {planningRecs.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRecs.map((rec, idx) => {
              const pConfig = priorityConfig[rec.priority] || priorityConfig.low;
              const cConfig = categoryConfig[rec.category] || categoryConfig.training;
              return (
                <div
                  key={rec.id}
                  className={`rounded-xl border ${pConfig.border} bg-card shadow-sm overflow-hidden transition-all hover:shadow-md`}
                >
                  {/* Priority stripe */}
                  <div className={`h-1 ${pConfig.bg}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Step number */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${pConfig.color} ${pConfig.bg}/50`}>
                            {pConfig.icon}
                            {pConfig.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${cConfig.color}`}>
                            {cConfig.icon}
                            {cConfig.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2 text-sm font-semibold text-foreground">{rec.title}</h3>

                        {/* Description */}
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{rec.description}</p>

                        {/* Action items */}
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <ActionItem label="Impact" value={rec.impact} icon={<Target className="h-3 w-3" />} />
                          <ActionItem label="Timeline" value={rec.timeline} icon={<Clock className="h-3 w-3" />} />
                          {rec.estimatedCost && (
                            <ActionItem label="Estimated Cost" value={rec.estimatedCost} icon={<DollarSign className="h-3 w-3" />} />
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">PENDING</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Implementation Roadmap ── */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          Implementation Roadmap
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4">
            <RoadmapItem
              phase="Immediate"
              timeframe="Now – 3 months"
              items={sortedRecs.filter((r) => r.priority === "critical").map((r) => r.title)}
              color="bg-red-500"
            />
            <RoadmapItem
              phase="Short-term"
              timeframe="3 – 12 months"
              items={sortedRecs.filter((r) => r.priority === "high").map((r) => r.title)}
              color="bg-orange-500"
            />
            <RoadmapItem
              phase="Medium-term"
              timeframe="12 – 24 months"
              items={sortedRecs.filter((r) => r.priority === "medium").map((r) => r.title)}
              color="bg-blue-500"
            />
            <RoadmapItem
              phase="Long-term"
              timeframe="24 – 36 months"
              items={sortedRecs.filter((r) => r.priority === "low").map((r) => r.title)}
              color="bg-green-500"
            />
          </div>
        </div>
      </div>

      {/* ── Operational Recommendations (existing) ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Operational Recommendations</h2>
          <Badge variant="secondary">{operationalRecs?.length ?? 0}</Badge>
        </div>

        {opsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {operationalRecs?.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm">{r.title}</h3>
                      <Badge variant="secondary" className="capitalize">{r.category}</Badge>
                      <Badge variant="secondary" className={`capitalize ${impactColor[r.impact]}`}>{r.impact} impact</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{Math.round(r.confidence * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="sm"><X className="mr-1.5 h-3.5 w-3.5" />Dismiss</Button>
                  <Button size="sm"><Check className="mr-1.5 h-3.5 w-3.5" />Apply</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function SummaryStat({ label, value, sub, accent, danger }: {
  label: string; value: string; sub: string; accent?: boolean; danger?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${danger ? "border-red-200 bg-red-50/50" : accent ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${danger ? "text-red-600" : accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ActionItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs text-foreground leading-relaxed">{value}</p>
    </div>
  );
}

function RoadmapItem({ phase, timeframe, items, color }: {
  phase: string; timeframe: string; items: string[]; color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="relative pl-10">
      <div className={`absolute left-2.5 top-1 h-3 w-3 rounded-full ${color} ring-2 ring-white`} />
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-foreground">{phase}</h4>
          <span className="text-[10px] text-muted-foreground">({timeframe})</span>
        </div>
        <ul className="mt-1 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}