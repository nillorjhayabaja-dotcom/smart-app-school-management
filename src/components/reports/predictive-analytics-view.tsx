import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { TrendingUp, Users, ShieldAlert, Brain, Sparkles, Activity } from "lucide-react";
import type { PredictiveSummary } from "@/types/reports";
import type { EnrollmentForecastRow, RetentionTrendRow } from "@/types/reports";

interface PredictiveAnalyticsViewProps {
  summary?: PredictiveSummary;
  enrollmentForecast: EnrollmentForecastRow[];
  retentionTrend: RetentionTrendRow[];
  loading: boolean;
}

export function PredictiveAnalyticsView({ summary, enrollmentForecast, retentionTrend, loading }: PredictiveAnalyticsViewProps) {
  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} height={100} />)}
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Predicted Enrollment
            </CardDescription>
            <CardTitle className="text-2xl">{summary.predictedEnrollment.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Confidence: {summary.enrollmentConfidence}%
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-red-500" /> Expected Resignations
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">{summary.expectedResignations}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Confidence: {summary.retentionConfidence}%
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5 text-blue-500" /> Staffing Needs
            </CardDescription>
            <CardTitle className="text-2xl">{summary.staffingNeeds}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            New hires required
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Future Risks
            </CardDescription>
            <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">{summary.futureRisks}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            At-risk employees identified
          </CardContent>
        </Card>
      </div>

      {/* Confidence Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Confidence Scores</CardTitle>
          <CardDescription>Prediction accuracy by model type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enrollment</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {summary.enrollmentConfidence}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${summary.enrollmentConfidence}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {summary.retentionConfidence}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${summary.retentionConfidence}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Assessment</span>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {summary.riskConfidence}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${summary.riskConfidence}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Workforce</span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {summary.workforceConfidence}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${summary.workforceConfidence}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What-If Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Forecast Scenarios</CardTitle>
          <CardDescription>What-if analysis based on different scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-emerald-500/5 p-4">
              <Badge className="mb-2 bg-emerald-500">Optimistic</Badge>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {summary.predictedEnrollment > 0
                  ? Math.round(summary.predictedEnrollment * 1.15).toLocaleString()
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">15% growth scenario</p>
              <p className="text-xs text-muted-foreground">
                Hires needed: {Math.ceil(summary.staffingNeeds * 1.2)}
              </p>
            </div>
            <div className="rounded-lg border bg-blue-500/5 p-4">
              <Badge className="mb-2 bg-blue-500">Most Likely</Badge>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {summary.predictedEnrollment.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Baseline projection</p>
              <p className="text-xs text-muted-foreground">
                Hires needed: {summary.staffingNeeds}
              </p>
            </div>
            <div className="rounded-lg border bg-amber-500/5 p-4">
              <Badge className="mb-2 bg-amber-500">Conservative</Badge>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {summary.predictedEnrollment > 0
                  ? Math.round(summary.predictedEnrollment * 0.92).toLocaleString()
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">8% decline scenario</p>
              <p className="text-xs text-muted-foreground">
                Hires needed: {Math.max(0, Math.ceil(summary.staffingNeeds * 0.8))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Future Risk Outlook</CardTitle>
          <CardDescription>Predicted risks and mitigation strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Staffing Shortage Risk</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                With {summary.expectedResignations} expected resignations and {summary.staffingNeeds} new positions needed,
                the total hiring requirement is approximately {summary.expectedResignations + summary.staffingNeeds} teachers.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Workload Imbalance Risk</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {summary.futureRisks} high-risk employees identified. Recommended workload redistribution
                and targeted interventions to mitigate burnout and turnover.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}