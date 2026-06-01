import { Users, GraduationCap, Scale, HeartHandshake, Star, ShieldAlert, TrendingUp, UserPlus, Activity, UserCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { CardSkeleton } from "@/components/shared/skeletons";
import type { QuickSummary } from "@/types/reports";

interface QuickSummaryProps {
  data?: QuickSummary;
  loading: boolean;
}

export function QuickSummaryCards({ data, loading }: QuickSummaryProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Students"
          value={data.totalStudents.toLocaleString()}
          delta={data.enrollmentGrowth}
          hint="vs last year"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <KpiCard
          label="Total Teachers"
          value={data.totalTeachers}
          delta={Math.round((data.activeTeachers / data.totalTeachers) * 100) - 100}
          hint={`${data.activeTeachers} active`}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          label="Student-Teacher Ratio"
          value={data.studentTeacherRatio.toFixed(1)}
          hint="Target: 25:1"
          icon={<Scale className="h-5 w-5" />}
        />
        <KpiCard
          label="Teacher Retention Rate"
          value={`${data.teacherRetentionRate}%`}
          delta={data.teacherRetentionRate - 85}
          hint="Target: 90%"
          icon={<HeartHandshake className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Average Performance"
          value={`${data.averageTeacherPerformance}%`}
          delta={data.averageTeacherPerformance - 75}
          hint="Rating score"
          icon={<Star className="h-5 w-5 text-amber-500" />}
        />
        <KpiCard
          label="High-Risk Teachers"
          value={data.highRiskTeachers}
          hint="Requires intervention"
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
          className="border-red-200 dark:border-red-900"
        />
        <KpiCard
          label="Projected Enrollment"
          value={data.projectedEnrollment.toLocaleString()}
          delta={Math.round(((data.projectedEnrollment - data.totalStudents) / data.totalStudents) * 100)}
          hint="Next academic year"
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <KpiCard
          label="Recommended New Hires"
          value={data.recommendedNewHires}
          hint="Based on forecast"
          icon={<UserPlus className="h-5 w-5 text-blue-500" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Utilization Rate</p>
              <p className="text-2xl font-semibold tabular-nums">{data.utilizationRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Target: 75-85%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Turnover Rate</p>
              <p className="text-2xl font-semibold tabular-nums">{data.teacherTurnoverRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Projected annual</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Staffing Gap</p>
              <p className="text-2xl font-semibold tabular-nums">{data.projectedStaffingGap}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Teachers needed</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Workload Distribution Balance
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-red-500/10 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.overloadedTeachers}</p>
              <p className="text-xs text-muted-foreground">Overloaded {String.fromCharCode(62)}90%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.balancedTeachers}</p>
              <p className="text-xs text-muted-foreground">Balanced (60-90%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-semibold">{data.underutilizedTeachers}</p>
              <p className="text-xs text-muted-foreground">Underutilized {String.fromCharCode(60)}60%</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}