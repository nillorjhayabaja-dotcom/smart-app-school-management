export type ReportId =
  | "executive"
  | "enrollment_forecast"
  | "teacher_retention"
  | "workforce_allocation"
  | "performance_analysis"
  | "risk_assessment"
  | "skill_gap"
  | "scheduling_efficiency"
  | "recommendations"
  | "predictive_analytics"
  | "audit_reports";

export type ExportFormat = "pdf" | "excel" | "csv" | "print";

export type RiskLevel = "low" | "medium" | "high";

export type EmploymentStatus = "active" | "inactive" | "on_leave";

export interface ReportFilter {
  academicYear?: string;
  dateRange?: [Date, Date];
  department?: string;
  strand?: string;
  teacher?: string;
  riskLevel?: RiskLevel;
  employmentStatus?: EmploymentStatus;
}

export interface ReportDef {
  id: ReportId;
  label: string;
  icon: string;
  description: string;
  category: "descriptive" | "diagnostic" | "predictive" | "prescriptive";
  roles: Array<"super_admin" | "hr_admin" | "department_head" | "viewer">;
}

export interface KpiMetric {
  label: string;
  value: number | string;
  delta?: number;
  hint?: string;
  icon?: string;
  trend?: "up" | "down" | "stable";
}

export interface EnrollmentForecastRow {
  year: number;
  historical: number | null;
  predicted: number;
  optimistic: number;
  conservative: number;
  employees: number;
  teachersNeeded: number;
  teacherStudentRatio: number;
  employeeSurplus: number;
}

export interface RetentionTrendRow {
  term: string;
  retention: number;
  predicted: number;
}

export interface WorkloadByDeptRow {
  department: string;
  workload: number;
  overloaded: number;
  underutilized: number;
  balanced: number;
}

export interface RiskHeatmapRow {
  department: string;
  low: number;
  medium: number;
  high: number;
  burnout: number;
  resignation: number;
  workload: number;
}

export interface PerformanceRow {
  name: string;
  department: string;
  performance: number;
  workload: number;
  attendance: number;
  feedback: number;
  training: number;
}

export interface SkillGapRow {
  skill: string;
  existing: number;
  missing: number;
  critical: boolean;
  trainingPriority: "high" | "medium" | "low";
}

export interface ScheduleEfficiencyRow {
  teacher: string;
  department: string;
  slots: number;
  conflicts: number;
  utilization: number;
  overtime: number;
}

export interface RecommendationItem {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  rationale: string;
  impact: string;
  confidence: number;
  implementationCost: "low" | "medium" | "high";
  category: string;
  expectedImpact: string;
  relatedMetrics?: string[];
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  at: string;
  ip: string;
  userAgent?: string;
}

export interface PredictiveSummary {
  predictedEnrollment: number;
  expectedResignations: number;
  staffingNeeds: number;
  futureRisks: number;
  enrollmentConfidence: number;
  retentionConfidence: number;
  riskConfidence: number;
  workforceConfidence: number;
}

export interface QuickSummary {
  totalStudents: number;
  totalTeachers: number;
  studentTeacherRatio: number;
  teacherRetentionRate: number;
  averageTeacherPerformance: number;
  highRiskTeachers: number;
  projectedEnrollment: number;
  recommendedNewHires: number;
  activeTeachers: number;
  utilizationRate: number;
  teacherTurnoverRate: number;
  projectedStaffingGap: number;
  enrollmentGrowth: number;
  overloadedTeachers: number;
  underutilizedTeachers: number;
  balancedTeachers: number;
}