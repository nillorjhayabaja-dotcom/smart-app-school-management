/**
 * Reports Service — Report Center data layer.
 *
 * IMPORTANT: This service is now unified with the shared mock-data.ts source.
 * All data originates from the same source as Dashboard, Predictive Analytics,
 * Recommendations, and Risk Assessment modules, ensuring cross-module consistency.
 *
 * When the backend goes live, this service replaces mock-data.ts calls with
 * apiRequest() calls — but always from the same unified endpoint.
 */
import { apiRequest } from "@/api/client";
import { jsPDF } from "jspdf";
import {
  mockEmployees,
  enrollmentForecast,
  enrollmentForecast3Year,
  enrollmentForecastSummary,
  retentionTrend,
  workloadByDept,
  riskHeatmap,
  performanceScatter,
  mockSchedule,
  mockRecommendations,
  mockAuditLogs,
  planningRecommendations,
} from "@/api/mock-data";
import type {
  ReportId,
  ExportFormat,
  ReportFilter,
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
  QuickSummary,
} from "@/types/reports";
import type { Employee, EnrollmentSummary, Recommendation, AuditLog, ScheduleEntry } from "@/types";

const delay = <T>(d: T, ms = 200) => new Promise<T>((r) => setTimeout(() => r(d), ms));

// ── Shared helpers (deterministic — no Math.random) ────────────────────

function transformEmployeesToPerformance(employees: Employee[]): PerformanceRow[] {
  return employees.map((e) => ({
    name: e.name,
    department: e.department,
    performance: e.performance,
    workload: e.workload,
    // Use employee's actual data where possible, fallback to deterministic values
    attendance: Math.round(e.workload * 0.85 + 15), // correlate with workload
    feedback: Math.round(e.performance * 0.8 + 20),  // correlate with performance
    training: Math.round(Math.max(10, e.performance * 0.3)), // correlate with performance
  }));
}

/** Load skill gap data from static CSV or use compiled fallback */
let CACHED_SKILL_GAP: SkillGapRow[] | null = null;

async function loadSkillGapData(): Promise<SkillGapRow[]> {
  if (CACHED_SKILL_GAP) return CACHED_SKILL_GAP;

  try {
    const res = await fetch("/data/skill-gap.csv");
    const csv = await res.text();
    const rows = csv.trim().split("\n").slice(1).map((line) => {
      const [skill, existing, missing, critical, trainingPriority] = line.split(",");
      return {
        skill: skill.trim(),
        existing: parseInt(existing, 10),
        missing: parseInt(missing, 10),
        critical: critical.trim() === "true",
        trainingPriority: trainingPriority.trim() as "high" | "medium" | "low",
      };
    });
    CACHED_SKILL_GAP = rows;
    return rows;
  } catch {
    // CSV not available — fall back to deterministic compile-time data
    return getCompiledSkillGap();
  }
}

/** Deterministic skill gap data (no Math.random) from mock-data's teaching context */
function getCompiledSkillGap(): SkillGapRow[] {
  return [
    { skill: "STEM Instruction", existing: 45, missing: 55, critical: true, trainingPriority: "high" },
    { skill: "ICT Proficiency", existing: 60, missing: 40, critical: true, trainingPriority: "high" },
    { skill: "Special Education", existing: 25, missing: 75, critical: true, trainingPriority: "high" },
    { skill: "Research Methodology", existing: 55, missing: 45, critical: false, trainingPriority: "medium" },
    { skill: "Classroom Management", existing: 75, missing: 25, critical: true, trainingPriority: "medium" },
    { skill: "Assessment Design", existing: 65, missing: 35, critical: false, trainingPriority: "medium" },
    { skill: "Digital Literacy", existing: 70, missing: 30, critical: false, trainingPriority: "low" },
    { skill: "Curriculum Development", existing: 50, missing: 50, critical: true, trainingPriority: "high" },
    { skill: "Data Analytics", existing: 30, missing: 70, critical: true, trainingPriority: "high" },
    { skill: "Counseling & Guidance", existing: 40, missing: 60, critical: false, trainingPriority: "medium" },
    { skill: "Laboratory Management", existing: 35, missing: 65, critical: false, trainingPriority: "medium" },
    { skill: "Sports Coaching", existing: 55, missing: 45, critical: false, trainingPriority: "low" },
  ];
}

function generateScheduleEfficiencyData(employees: Employee[], schedule: ScheduleEntry[]): ScheduleEfficiencyRow[] {
  const teacherSlots: Record<string, { slots: number; conflicts: number; overtime: number }> = {};

  schedule.forEach((s) => {
    if (!teacherSlots[s.employeeName]) {
      teacherSlots[s.employeeName] = { slots: 0, conflicts: 0, overtime: 0 };
    }
    teacherSlots[s.employeeName].slots++;
    if (s.conflict) teacherSlots[s.employeeName].conflicts++;
  });

  return employees
    .filter((e) => e.status === "active")
    .map((e) => {
      const data = teacherSlots[e.name] || { slots: 0, conflicts: 0, overtime: 0 };
      return {
        teacher: e.name,
        department: e.department,
        slots: data.slots,
        conflicts: data.conflicts,
        utilization: Math.round((data.slots / 40) * 100),
        overtime: Math.round(e.workload * 0.05), // deterministic from workload
      };
    });
}

/** Load recommendations from shared planningRecommendations (same source as Recommendations module) */
function buildReportRecommendations(): RecommendationItem[] {
  // Convert planningRecommendations (from mock-data.ts) to RecommendationItem type
  return planningRecommendations.map((pr) => ({
    id: pr.id,
    priority: pr.priority,
    title: pr.title,
    description: pr.description,
    rationale: `Based on enrollment forecast analysis: ${enrollmentForecastSummary.growthPercentage}% growth over 3 years.`,
    impact: pr.impact,
    confidence: pr.priority === "critical" ? 92 : pr.priority === "high" ? 84 : pr.priority === "medium" ? 75 : 65,
    implementationCost: (pr.priority === "critical" ? "high" : pr.priority === "high" ? "medium" : "low") as "low" | "medium" | "high",
    category: pr.category === "hiring" ? "workforce" : pr.category,
    expectedImpact: pr.impact,
    relatedMetrics: ["studentTeacherRatio", "teacherWorkload"],
  }));
}

function buildPredictiveSummary(employees: Employee[], enrollmentSummary: EnrollmentSummary): PredictiveSummary {
  const highRisk = employees.filter((e) => e.retentionRisk === "high" && e.status !== "inactive").length;
  return {
    predictedEnrollment: enrollmentSummary.projectedYear1,
    expectedResignations: Math.round(highRisk * 0.35),
    staffingNeeds: Math.ceil(enrollmentSummary.teachersDeficit),
    futureRisks: highRisk,
    enrollmentConfidence: typeof enrollmentSummary.confidence === "number" ? enrollmentSummary.confidence : 85,
    retentionConfidence: 78,
    riskConfidence: 82,
    workforceConfidence: 88,
  };
}

/** Load audit logs from shared mockAuditLogs (same source as Audit module) */
function buildAuditLogs(): AuditLogEntry[] {
  return mockAuditLogs.map((log) => ({
    id: log.id,
    actor: log.actor,
    action: log.action,
    target: log.target,
    details: `Action: ${log.action} on ${log.target}`,
    at: log.at,
    ip: log.ip,
    userAgent: navigator.userAgent,
  }));
}

// ── Shared Service ─────────────────────────────────────────────────────

export const reportsService = {
  /**
   * Quick Summary — computed from the SAME shared data as Dashboard KPI cards.
   * Uses enrollmentForecastSummary (the SINGLE source of truth for enrollment data).
   */
  async getQuickSummary(employees: Employee[], enrollmentSummary: EnrollmentSummary, retentionTrendData: RetentionTrendRow[]): Promise<QuickSummary> {
    const totalStudents = enrollmentSummary?.currentEnrollment ?? 0;
    const totalTeachers = employees.length;
    const activeTeachers = employees.filter((e) => e.status === "active").length;
    const studentTeacherRatio = activeTeachers > 0 ? totalStudents / activeTeachers : 0;

    const avgWorkloadActive = (() => {
      const active = employees.filter((e) => e.status === "active");
      if (!active.length) return 0;
      return active.reduce((s, e) => s + e.workload, 0) / active.length;
    })();

    const avgPerformance = employees.length
      ? employees.reduce((s, e) => s + e.performance, 0) / employees.length
      : 0;

    const highRiskTeachers = employees.filter(
      (e) => e.retentionRisk === "high" && e.status !== "inactive",
    ).length;

    const retentionRate = retentionTrendData.length
      ? retentionTrendData.reduce((s: number, t: RetentionTrendRow) => s + t.retention, 0) / retentionTrendData.length
      : 0;

    const active = employees.filter((e) => e.status === "active");
    const overloaded = active.filter((e) => e.workload > 90).length;
    const underutilized = active.filter((e) => e.workload < 60).length;
    const balanced = active.length - overloaded - underutilized;

    return {
      totalStudents,
      totalTeachers,
      studentTeacherRatio: Math.round(studentTeacherRatio * 100) / 100,
      teacherRetentionRate: Math.round(clamp(retentionRate, 0, 100)),
      averageTeacherPerformance: Math.round(avgPerformance),
      highRiskTeachers,
      projectedEnrollment: enrollmentSummary?.projectedYear1 ?? 0,
      recommendedNewHires: Math.ceil(enrollmentSummary?.teachersDeficit ?? 0),
      activeTeachers,
      utilizationRate: Math.round(clamp(avgWorkloadActive, 0, 100)),
      teacherTurnoverRate: Math.round(clamp(100 - retentionRate, 0, 100)),
      projectedStaffingGap: Math.round(enrollmentSummary?.teachersDeficit ?? 0),
      enrollmentGrowth: enrollmentSummary?.totalGrowth ?? 0,
      overloadedTeachers: overloaded,
      underutilizedTeachers: underutilized,
      balancedTeachers: balanced,
    };
  },

  /**
   * Executive Summary — now computed from LIVE shared data instead of hardcoded values.
   */
  async getExecutiveSummary(employees: Employee[], enrollmentSummary: EnrollmentSummary) {
    const activeTeachers = employees.filter((e) => e.status === "active").length;
    const avgWorkload = activeTeachers
      ? Math.round(employees.filter((e) => e.status === "active").reduce((s, e) => s + e.workload, 0) / activeTeachers)
      : 0;
    const retention: RetentionTrendRow[] = retentionTrend as RetentionTrendRow[];
    const avgRetention = retention.length
      ? Math.round(retention.reduce((s, r) => s + r.retention, 0) / retention.length)
      : 88;

    return {
      schoolOverview: {
        name: "Smart School Academy",
        address: "Metro Manila, Philippines",
        academicYear: "2025-2026",
        totalStudents: enrollmentSummary?.currentEnrollment ?? 2850,
        totalFaculty: employees.length,
        avgWorkload,
        utilizationRate: Math.round(clamp(avgWorkload, 0, 100)),
        retentionRate: avgRetention,
      },
    };
  },

  // ── Enrollment Forecast ──────────────────────────────────────────────
  async getEnrollmentForecast(): Promise<EnrollmentForecastRow[]> {
    return delay(enrollmentForecast3Year as EnrollmentForecastRow[]);
  },

  async getEnrollmentSummary(): Promise<EnrollmentSummary> {
    return delay(enrollmentForecastSummary);
  },

  // ── Teacher Retention ────────────────────────────────────────────────
  async getRetentionTrend(): Promise<RetentionTrendRow[]> {
    return delay(retentionTrend as RetentionTrendRow[]);
  },

  // ── Workforce Allocation ─────────────────────────────────────────────
  async getWorkforceAllocation(employees: Employee[]): Promise<WorkloadByDeptRow[]> {
    const deptMap = new Map<string, { workload: number; overloaded: number; underutilized: number; balanced: number }>();
    const activeTeachers = employees.filter((e) => e.status === "active");

    const allDepts = [...new Set(employees.map((e) => e.department))];
    allDepts.forEach((d) => deptMap.set(d, { workload: 0, overloaded: 0, underutilized: 0, balanced: 0 }));

    activeTeachers.forEach((e) => {
      const dept = deptMap.get(e.department) || { workload: 0, overloaded: 0, underutilized: 0, balanced: 0 };
      dept.workload = Math.max(dept.workload, e.workload);
      if (e.workload > 90) dept.overloaded++;
      else if (e.workload < 60) dept.underutilized++;
      else dept.balanced++;
      deptMap.set(e.department, dept);
    });

    return delay(Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      workload: data.workload,
      overloaded: data.overloaded,
      underutilized: data.underutilized,
      balanced: data.balanced,
    })));
  },

  // ── Risk Assessment ──────────────────────────────────────────────────
  async getRiskAssessment(employees: Employee[]): Promise<RiskHeatmapRow[]> {
    const depts = [...new Set(employees.map((e) => e.department))];
    const enhanced = depts.map((department) => {
      const deptEmployees = employees.filter((e) => e.department === department);
      const high = deptEmployees.filter((e) => e.retentionRisk === "high").length;
      const medium = deptEmployees.filter((e) => e.retentionRisk === "medium").length;
      const low = deptEmployees.length - high - medium;
      const burnout = Math.round((deptEmployees.filter((e) => e.workload > 85).length / Math.max(deptEmployees.length, 1)) * 100);
      const resignation = Math.round((high / Math.max(deptEmployees.length, 1)) * 100);
      const workload = Math.round(deptEmployees.reduce((s, e) => s + e.workload, 0) / Math.max(deptEmployees.length, 1));
      return { department, low, medium, high, burnout, resignation, workload };
    });
    return delay(enhanced);
  },

  // ── Performance Analysis ─────────────────────────────────────────────
  async getPerformanceAnalysis(employees: Employee[]): Promise<PerformanceRow[]> {
    return delay(transformEmployeesToPerformance(employees));
  },

  // ── Skill Gap Analysis ───────────────────────────────────────────────
  async getSkillGapAnalysis(): Promise<SkillGapRow[]> {
    return delay(await loadSkillGapData());
  },

  // ── Scheduling Efficiency ────────────────────────────────────────────
  async getSchedulingEfficiency(employees: Employee[], schedule: ScheduleEntry[]): Promise<ScheduleEfficiencyRow[]> {
    return delay(generateScheduleEfficiencyData(employees, schedule));
  },

  // ── Recommendations ──────────────────────────────────────────────────
  async getRecommendations(): Promise<RecommendationItem[]> {
    return delay(buildReportRecommendations());
  },

  // ── Predictive Analytics ─────────────────────────────────────────────
  async getPredictiveSummary(employees: Employee[], enrollmentSummary: EnrollmentSummary): Promise<PredictiveSummary> {
    return delay(buildPredictiveSummary(employees, enrollmentSummary));
  },

  // ── Audit Reports ────────────────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return delay(buildAuditLogs());
  },

  // ── Export ───────────────────────────────────────────────────────────
  async exportReport(reportId: ReportId, format: ExportFormat, filters?: ReportFilter): Promise<Blob> {
    if (format === "pdf") {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date();

      // Header
      doc.setFontSize(18);
      doc.text("Smart School Academy", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text("Reports Center", pageWidth / 2, 28, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Report: ${reportId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, 14, 38);
      doc.text(`Generated: ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 44);
      doc.text(`Format: PDF`, 14, 50);
      if (filters && Object.keys(filters).length) {
        doc.text(`Filters: ${JSON.stringify(filters)}`, 14, 56);
      }

      // Separator line
      doc.setDrawColor(200);
      doc.line(14, 60, pageWidth - 14, 60);

      // Placeholder content
      doc.setFontSize(12);
      let y = 68;
      doc.text("Summary", 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text("This report provides an overview of key metrics and analytics for the selected academic period.", 14, y);
      y += 10;
      doc.text("For detailed interactive visualizations, please view the report within the application.", 14, y);
      y += 10;
      doc.text("Export date: " + now.toISOString(), 14, y);

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Smart App School Management System — Confidential", pageWidth / 2, footerY, { align: "center" });
      doc.text(`Page 1`, pageWidth / 2, footerY + 4, { align: "center" });

      const blob = doc.output("blob");
      return delay(blob, 500);
    }

    if (format === "excel") {
      // For Excel, create a CSV with proper MIME type
      const content = `Report,${reportId}\nFormat,${format}\nGenerated,${new Date().toISOString()}\nFilters,${JSON.stringify(filters || {})}`;
      const blob = new Blob([content], {
        type: "text/csv",
      });
      return delay(blob, 500);
    }

    // CSV format
    const content = `Report,${reportId}\nFormat,${format}\nGenerated,${new Date().toISOString()}\nFilters,${JSON.stringify(filters || {})}`;
    const blob = new Blob([content], {
      type: "text/csv;charset=utf-8",
    });
    return delay(blob, 500);
  },

  // ── Report Metadata ──────────────────────────────────────────────────
  async getReportHistory() {
    return delay([
      { id: "RPT-1", name: "Executive Summary Q3 2025", type: "PDF", size: "1.2 MB", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-2", name: "Enrollment Forecast 2025-2026", type: "XLSX", size: "642 KB", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-3", name: "Teacher Retention Analysis", type: "PDF", size: "2.1 MB", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-4", name: "Workforce Allocation Report", type: "CSV", size: "385 KB", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-5", name: "Risk Assessment Matrix", type: "PDF", size: "1.8 MB", createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-6", name: "Performance Analysis Summary", type: "XLSX", size: "920 KB", createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "RPT-7", name: "Skill Gap Assessment", type: "PDF", size: "1.5 MB", createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    ]);
  },

  // ── Academic Years ───────────────────────────────────────────────────
  async getAcademicYears(): Promise<string[]> {
    return delay(["2023-2024", "2024-2025", "2025-2026", "2026-2027"]);
  },

  // ── Departments ──────────────────────────────────────────────────────
  async getDepartments(employees: Employee[]): Promise<string[]> {
    const depts = [...new Set(employees.map((e) => e.department))];
    return delay(depts);
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}