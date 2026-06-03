import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { Sparkles, Target, TrendingUp, DollarSign, AlertTriangle, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";
import type { RecommendationItem } from "@/types/reports";

interface RecommendationsViewProps {
  data: RecommendationItem[];
  loading: boolean;
}

const priorityColors: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500", border: "border-red-200 dark:border-red-900" },
  high: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", border: "border-amber-200 dark:border-amber-900" },
  medium: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", border: "border-blue-200 dark:border-blue-900" },
  low: { color: "text-muted-foreground", bg: "bg-muted-foreground", border: "border-border" },
};

const costLabels: Record<string, string> = {
  low: "$",
  medium: "$$",
  high: "$$$",
};

export function RecommendationsView({ data, loading }: RecommendationsViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={400} />
      </div>
    );
  }

  const critical = data.filter((d) => d.priority === "critical").length;
  const high = data.filter((d) => d.priority === "high").length;
  const medium = data.filter((d) => d.priority === "medium").length;
  const low = data.filter((d) => d.priority === "low").length;

  const sortedByPriority = [...data].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600 dark:text-red-400 font-semibold">Critical</CardDescription>
            <CardTitle className="text-2xl">{critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600 dark:text-amber-400 font-semibold">High</CardDescription>
            <CardTitle className="text-2xl">{high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-600 dark:text-blue-400 font-semibold">Medium</CardDescription>
            <CardTitle className="text-2xl">{medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-semibold">Low</CardDescription>
            <CardTitle className="text-2xl">{low}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {sortedByPriority.map((rec) => {
          const pc = priorityColors[rec.priority] || priorityColors.low;
          return (
            <Card key={rec.id} className={`border-l-4 ${pc.border}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pc.bg}/10`}>
                    {rec.priority === "critical" ? (
                      <AlertTriangle className={`h-4 w-4 ${pc.color}`} />
                    ) : rec.priority === "high" ? (
                      <TrendingUp className={`h-4 w-4 ${pc.color}`} />
                    ) : (
                      <Lightbulb className={`h-4 w-4 ${pc.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
<div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>

                          {/* Department mapped from relatedMetrics[0] */}
                          {rec.relatedMetrics?.[0] && (
                            <p className="text-[10px] text-primary mt-1 font-medium">
                              Department: {rec.relatedMetrics[0]}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={rec.priority === "critical" ? "destructive" : rec.priority === "high" ? "secondary" : "outline"} className="text-[10px] uppercase">
                            {rec.priority}
                          </Badge>

                          {/* Action button */}
                          <button
                            className="rounded-md bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 text-[10px] font-medium transition-colors"
                          >
                            Take Action
                          </button>
                        </div>
                      </div>

                    {rec.rationale && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium">Rationale</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.rationale}</p>
                      </div>
                    )}

                    <div className="mt-3 grid gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] text-muted-foreground">Impact</span>
                        <span className="text-[10px] font-medium">{rec.expectedImpact}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[10px] text-muted-foreground">Confidence</span>
                        <span className="text-[10px] font-medium">{rec.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] text-muted-foreground">Cost</span>
                        <span className="text-[10px] font-medium">{costLabels[rec.implementationCost]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground capitalize">{rec.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}