import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { Puzzle, Brain, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import type { SkillGapRow } from "@/types/reports";

interface SkillGapViewProps {
  data: SkillGapRow[];
  loading: boolean;
}

export function SkillGapView({ data, loading }: SkillGapViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  const criticalGaps = data.filter((d) => d.critical).length;
  const highPriority = data.filter((d) => d.trainingPriority === "high").length;
  const avgCoverage = data.length ? Math.round(data.reduce((s, d) => s + d.existing, 0) / data.length) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Puzzle className="h-3.5 w-3.5 text-primary" /> Skills Assessed
            </CardDescription>
            <CardTitle className="text-2xl">{data.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5 text-rose-500" /> Skill Coverage
            </CardDescription>
            <CardTitle className="text-2xl">{avgCoverage}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Critical Gaps
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">{criticalGaps}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" /> High Priority Training
            </CardDescription>
            <CardTitle className="text-2xl">{highPriority}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Skill Gap Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competency Assessment & Skill Gap Analysis</CardTitle>
          <CardDescription>Existing vs. missing skills with training priorities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Skill</th>
                  <th className="pb-2 font-medium text-muted-foreground">Coverage</th>
                  <th className="pb-2 font-medium text-muted-foreground">Existing</th>
                  <th className="pb-2 font-medium text-muted-foreground">Missing</th>
                  <th className="pb-2 font-medium text-muted-foreground">Critical</th>
                  <th className="pb-2 font-medium text-muted-foreground">Training Priority</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.skill} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 font-medium">{row.skill}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${
                            row.existing >= 70 ? 'bg-emerald-500' :
                            row.existing >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${row.existing}%` }} />
                        </div>
                        <span className="tabular-nums text-xs">{row.existing}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 tabular-nums text-emerald-600 dark:text-emerald-400">{row.existing}%</td>
                    <td className="py-2.5 tabular-nums text-red-600 dark:text-red-400">{row.missing}%</td>
                    <td className="py-2.5">
                      {row.critical ? (
                        <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Normal</Badge>
                      )}
                    </td>
                    <td className="py-2.5">
                      <Badge variant={
                        row.trainingPriority === "high" ? "destructive" :
                        row.trainingPriority === "medium" ? "secondary" : "outline"
                      } className="text-[10px] capitalize">
                        {row.trainingPriority}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Training Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Needs Summary</CardTitle>
          <CardDescription>Recommended training programs based on skill gaps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.filter(d => d.trainingPriority === "high").slice(0, 6).map((row) => (
              <div key={row.skill} className="rounded-lg border p-3 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{row.skill}</span>
                  <Badge variant="destructive" className="text-[10px]">
                    {row.missing}% gap
                  </Badge>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${row.missing}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {row.existing}% coverage — {row.missing}% needs training
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}