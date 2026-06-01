import { useReports } from "@/hooks/use-reports";
import { ReportHeader } from "@/components/reports/report-header";
import { QuickSummaryCards } from "@/components/reports/quick-summary";
import { ExecutiveSummaryView } from "@/components/reports/executive-summary-view";
import { EnrollmentForecastView } from "@/components/reports/enrollment-forecast-view";
import { TeacherRetentionView } from "@/components/reports/teacher-retention-view";
import { WorkforceAllocationView } from "@/components/reports/workforce-allocation-view";
import { PerformanceAnalysisView } from "@/components/reports/performance-analysis-view";
import { RiskAssessmentView } from "@/components/reports/risk-assessment-view";
import { SkillGapView } from "@/components/reports/skill-gap-view";
import { SchedulingEfficiencyView } from "@/components/reports/scheduling-efficiency-view";
import { RecommendationsView } from "@/components/reports/recommendations-view";
import { PredictiveAnalyticsView } from "@/components/reports/predictive-analytics-view";
import { AuditView } from "@/components/reports/audit-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  TrendingUp,
  HeartHandshake,
  Network,
  Star,
  ShieldAlert,
  Puzzle,
  CalendarRange,
  Sparkles,
  Brain,
  ScrollText,
  FileBarChart2,
  Loader2,
} from "lucide-react";
import type { ReportId } from "@/types/reports";

const reportTabs: { id: ReportId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "executive", label: "Executive Summary", icon: LayoutDashboard },
  { id: "enrollment_forecast", label: "Enrollment Forecast", icon: TrendingUp },
  { id: "teacher_retention", label: "Teacher Retention", icon: HeartHandshake },
  { id: "workforce_allocation", label: "Workforce Allocation", icon: Network },
  { id: "performance_analysis", label: "Performance Analysis", icon: Star },
  { id: "risk_assessment", label: "Risk Assessment", icon: ShieldAlert },
  { id: "skill_gap", label: "Skill Gap Analysis", icon: Puzzle },
  { id: "scheduling_efficiency", label: "Scheduling Efficiency", icon: CalendarRange },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
  { id: "predictive_analytics", label: "Predictive Analytics", icon: Brain },
  { id: "audit_reports", label: "Audit Reports", icon: ScrollText },
];

export function ReportsPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    academicYears,
    academicYearsLoading,
    quickSummary,
    quickSummaryLoading,
    executiveSummary,
    executiveSummaryLoading,
    enrollmentForecast,
    enrollmentForecastLoading,
    enrollmentSummary,
    retentionTrend,
    retentionTrendLoading,
    workforce,
    workforceLoading,
    performanceData,
    performanceLoading,
    riskData,
    riskLoading,
    skillGapData,
    skillGapLoading,
    schedulingData,
    schedulingLoading,
    recommendations,
    recommendationsLoading,
    predictiveSummary,
    predictiveLoading,
    auditLogs,
    auditLoading,
    reportHistory,
    exporting,
    exportReport,
    printReport,
    isLoading,
  } = useReports();

  const selectedYear = filters.academicYear ?? (academicYears[academicYears.length - 1] || "2025-2026");

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <ReportHeader
        academicYears={academicYears}
        selectedYear={selectedYear}
        onYearChange={(year) => setFilters({ ...filters, academicYear: year })}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={(format) => exportReport(activeTab, format)}
        onPrint={printReport}
        exporting={exporting}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Quick Summary */}
      <QuickSummaryCards data={quickSummary} loading={quickSummaryLoading} />

      {/* Report History */}
      {reportHistory.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">Recent:</span>
          {reportHistory.slice(0, 5).map((r: { id: string; name: string; type: string }) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2.5 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap"
            >
              <FileBarChart2 className="h-3 w-3" />
              {r.name}
            </span>
          ))}
        </div>
      )}

      {/* Report Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ReportId)}
        className="space-y-6"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto w-max gap-1 p-1">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-8 gap-1.5 px-3 text-xs data-[state=active]:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.replace(/[a-z]/g, "").slice(0, 3)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="executive" className="mt-0 space-y-6">
          <ExecutiveSummaryView data={executiveSummary} loading={executiveSummaryLoading} />
        </TabsContent>

        <TabsContent value="enrollment_forecast" className="mt-0 space-y-6">
          <EnrollmentForecastView
            data={enrollmentForecast}
            summary={enrollmentSummary}
            loading={enrollmentForecastLoading}
          />
        </TabsContent>

        <TabsContent value="teacher_retention" className="mt-0 space-y-6">
          <TeacherRetentionView data={retentionTrend} loading={retentionTrendLoading} />
        </TabsContent>

        <TabsContent value="workforce_allocation" className="mt-0 space-y-6">
          <WorkforceAllocationView data={workforce} loading={workforceLoading} />
        </TabsContent>

        <TabsContent value="performance_analysis" className="mt-0 space-y-6">
          <PerformanceAnalysisView data={performanceData} loading={performanceLoading} />
        </TabsContent>

        <TabsContent value="risk_assessment" className="mt-0 space-y-6">
          <RiskAssessmentView data={riskData} loading={riskLoading} />
        </TabsContent>

        <TabsContent value="skill_gap" className="mt-0 space-y-6">
          <SkillGapView data={skillGapData} loading={skillGapLoading} />
        </TabsContent>

        <TabsContent value="scheduling_efficiency" className="mt-0 space-y-6">
          <SchedulingEfficiencyView data={schedulingData} loading={schedulingLoading} />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-0 space-y-6">
          <RecommendationsView data={recommendations} loading={recommendationsLoading} />
        </TabsContent>

        <TabsContent value="predictive_analytics" className="mt-0 space-y-6">
          <PredictiveAnalyticsView
            summary={predictiveSummary}
            enrollmentForecast={enrollmentForecast}
            retentionTrend={retentionTrend}
            loading={predictiveLoading}
          />
        </TabsContent>

        <TabsContent value="audit_reports" className="mt-0 space-y-6">
          <AuditView data={auditLogs} loading={auditLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}