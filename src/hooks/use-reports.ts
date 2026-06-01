import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports";
import { useAuth } from "@/lib/auth";
import { useState, useCallback } from "react";
import { employeeService, schedulingService } from "@/services";
import type {
  ReportId,
  ExportFormat,
  ReportFilter,
  QuickSummary,
  EnrollmentForecastRow,
  RetentionTrendRow,
  WorkloadByDeptRow,
  RiskHeatmapRow,
  PerformanceRow,
  SkillGapRow,
  ScheduleEfficiencyRow,
  RecommendationItem,
  AuditLogEntry,
  PredictiveSummary,
} from "@/types/reports";
import type { Employee, EnrollmentSummary, ScheduleEntry } from "@/types";

interface ReportState {
  searchQuery: string;
  activeTab: ReportId;
  filters: ReportFilter;
}

const DEFAULT_FILTERS: ReportFilter = {};
const DEFAULT_TAB: ReportId = "executive";

/**
 * Shared employee fetcher — single source of truth.
 * Uses the same mock service as Dashboard, Risk, Workload, and other modules.
 */
function useEmployees() {
  return useQuery({
    queryKey: ["reports", "employees"],
    queryFn: (): Promise<Employee[]> => employeeService.list(),
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * Shared schedule fetcher — single source of truth.
 * Uses the same mock service as Scheduling module.
 */
function useSchedule() {
  return useQuery({
    queryKey: ["reports", "schedule"],
    queryFn: (): Promise<ScheduleEntry[]> => schedulingService.list(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useReports() {
  const { user } = useAuth();
  const [state, setState] = useState<ReportState>({
    searchQuery: "",
    activeTab: DEFAULT_TAB,
    filters: DEFAULT_FILTERS,
  });

  const setActiveTab = useCallback((tab: ReportId) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setFilters = useCallback((filters: ReportFilter) => {
    setState((prev) => ({ ...prev, filters }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: DEFAULT_FILTERS, searchQuery: "" }));
  }, []);

  // ── Shared Data Queries (single fetches, reused across views) ─────────
  const employeesQuery = useEmployees();
  const scheduleQuery = useSchedule();
  const employees = employeesQuery.data ?? [];
  const schedule = scheduleQuery.data ?? [];

  // ── Academic Years & Departments ──────────────────────────────────────
  const academicYearsQuery = useQuery({
    queryKey: ["reports", "academic-years"],
    queryFn: () => reportsService.getAcademicYears(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Enrollment Summary (shared) ───────────────────────────────────────
  const enrollmentSummaryQuery = useQuery({
    queryKey: ["reports", "enrollment-summary"],
    queryFn: () => reportsService.getEnrollmentSummary(),
    staleTime: 5 * 60 * 1000,
  });
  const enrollmentSummary = enrollmentSummaryQuery.data;

  // ── Quick Summary ─────────────────────────────────────────────────────
  const quickSummaryQuery = useQuery({
    queryKey: ["reports", "quick-summary"],
    queryFn: async () => {
      const retentionRes = await reportsService.getRetentionTrend();
      return reportsService.getQuickSummary(employees, enrollmentSummary!, retentionRes);
    },
    enabled: employees.length > 0 && !!enrollmentSummary,
    staleTime: 60_000,
    retry: 1,
  });

  // ── Executive Summary (now computed from live data) ───────────────────
  const executiveSummaryQuery = useQuery({
    queryKey: ["reports", "executive-summary", employees.length, enrollmentSummary?.currentEnrollment],
    queryFn: () => reportsService.getExecutiveSummary(employees, enrollmentSummary!),
    enabled: employees.length > 0 && !!enrollmentSummary,
    staleTime: 60_000,
  });

  // ── Enrollment Forecast ───────────────────────────────────────────────
  const enrollmentForecastQuery = useQuery({
    queryKey: ["reports", "enrollment-forecast"],
    queryFn: () => reportsService.getEnrollmentForecast(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Teacher Retention ─────────────────────────────────────────────────
  const retentionTrendQuery = useQuery({
    queryKey: ["reports", "retention-trend"],
    queryFn: () => reportsService.getRetentionTrend(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Workforce Allocation ──────────────────────────────────────────────
  const workforceQuery = useQuery({
    queryKey: ["reports", "workforce", employees.length],
    queryFn: () => reportsService.getWorkforceAllocation(employees),
    enabled: employees.length > 0,
    staleTime: 60_000,
  });

  // ── Risk Assessment ───────────────────────────────────────────────────
  const riskQuery = useQuery({
    queryKey: ["reports", "risk", employees.length],
    queryFn: () => reportsService.getRiskAssessment(employees),
    enabled: employees.length > 0,
    staleTime: 60_000,
  });

  // ── Performance Analysis ──────────────────────────────────────────────
  const performanceQuery = useQuery({
    queryKey: ["reports", "performance", employees.length],
    queryFn: () => reportsService.getPerformanceAnalysis(employees),
    enabled: employees.length > 0,
    staleTime: 60_000,
  });

  // ── Skill Gap Analysis ────────────────────────────────────────────────
  const skillGapQuery = useQuery({
    queryKey: ["reports", "skill-gap"],
    queryFn: () => reportsService.getSkillGapAnalysis(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Scheduling Efficiency ─────────────────────────────────────────────
  const schedulingQuery = useQuery({
    queryKey: ["reports", "scheduling", employees.length, schedule.length],
    queryFn: () => reportsService.getSchedulingEfficiency(employees, schedule),
    enabled: employees.length > 0 && schedule.length > 0,
    staleTime: 60_000,
  });

  // ── Recommendations ──────────────────────────────────────────────────
  const recommendationsQuery = useQuery({
    queryKey: ["reports", "recommendations"],
    queryFn: () => reportsService.getRecommendations(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Predictive Analytics ─────────────────────────────────────────────
  const predictiveQuery = useQuery({
    queryKey: ["reports", "predictive", employees.length],
    queryFn: () => reportsService.getPredictiveSummary(employees, enrollmentSummary!),
    enabled: employees.length > 0 && !!enrollmentSummary,
    staleTime: 5 * 60 * 1000,
  });

  // ── Audit Reports ────────────────────────────────────────────────────
  const auditQuery = useQuery({
    queryKey: ["reports", "audit"],
    queryFn: () => reportsService.getAuditLogs(),
    staleTime: 30_000,
  });

  // ── Report History ────────────────────────────────────────────────────
  const historyQuery = useQuery({
    queryKey: ["reports", "history"],
    queryFn: () => reportsService.getReportHistory(),
    staleTime: 30_000,
  });

  // ── Export ────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState<{ id: ReportId; format: ExportFormat } | null>(null);

  const exportReport = useCallback(
    async (reportId: ReportId, format: ExportFormat, filters?: ReportFilter) => {
      setExporting({ id: reportId, format });
      try {
        const blob = await reportsService.exportReport(reportId, format, { ...state.filters, ...filters });
        const ext = format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportId}-${new Date().toISOString().split("T")[0]}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        setExporting(null);
      }
    },
    [state.filters]
  );

  // ── Print ─────────────────────────────────────────────────────────────
  const printReport = useCallback(() => {
    window.print();
  }, []);

  return {
    // State
    activeTab: state.activeTab,
    searchQuery: state.searchQuery,
    filters: state.filters,
    setActiveTab,
    setSearchQuery,
    setFilters,
    clearFilters,

    // Academic Years
    academicYears: academicYearsQuery.data ?? [],
    academicYearsLoading: academicYearsQuery.isLoading,

    // Quick Summary
    quickSummary: quickSummaryQuery.data,
    quickSummaryLoading: quickSummaryQuery.isLoading,

    // Executive Summary
    executiveSummary: executiveSummaryQuery.data,
    executiveSummaryLoading: executiveSummaryQuery.isLoading,

    // Enrollment
    enrollmentForecast: enrollmentForecastQuery.data ?? [],
    enrollmentForecastLoading: enrollmentForecastQuery.isLoading,
    enrollmentSummary: enrollmentSummaryQuery.data,
    enrollmentSummaryLoading: enrollmentSummaryQuery.isLoading,

    // Retention
    retentionTrend: retentionTrendQuery.data ?? [],
    retentionTrendLoading: retentionTrendQuery.isLoading,

    // Workforce
    workforce: workforceQuery.data ?? [],
    workforceLoading: workforceQuery.isLoading,

    // Risk
    riskData: riskQuery.data ?? [],
    riskLoading: riskQuery.isLoading,

    // Performance
    performanceData: performanceQuery.data ?? [],
    performanceLoading: performanceQuery.isLoading,

    // Skill Gap
    skillGapData: skillGapQuery.data ?? [],
    skillGapLoading: skillGapQuery.isLoading,

    // Scheduling
    schedulingData: schedulingQuery.data ?? [],
    schedulingLoading: schedulingQuery.isLoading,

    // Recommendations
    recommendations: recommendationsQuery.data ?? [],
    recommendationsLoading: recommendationsQuery.isLoading,

    // Predictive
    predictiveSummary: predictiveQuery.data,
    predictiveLoading: predictiveQuery.isLoading,

    // Audit
    auditLogs: auditQuery.data ?? [],
    auditLoading: auditQuery.isLoading,

    // History
    reportHistory: historyQuery.data ?? [],
    historyLoading: historyQuery.isLoading,

    // Export
    exporting,
    exportReport,
    printReport,

    // Is loading
    isLoading:
      employeesQuery.isLoading ||
      quickSummaryQuery.isLoading ||
      enrollmentForecastQuery.isLoading ||
      retentionTrendQuery.isLoading ||
      workforceQuery.isLoading ||
      performanceQuery.isLoading ||
      skillGapQuery.isLoading,
  } as const;
}