export type Role = "super_admin" | "hr_admin" | "department_head" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  department?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive" | "on_leave";
  workload: number; // 0-100
  performance: number; // 0-100
  retentionRisk: "low" | "medium" | "high";
  skills: string[];
  joinedAt: string;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  day: string; // Mon..Fri
  start: string;
  end: string;
  subject: string;
  room: string;
  conflict?: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  category: "allocation" | "training" | "retention" | "scheduling";
  impact: "low" | "medium" | "high";
  confidence: number;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  ip: string;
}

export interface EnrollmentSummary {
  currentEnrollment: number;
  projectedYear1: number;
  projectedYear2: number;
  projectedYear3: number;
  totalGrowth: number;
  growthPercentage: number;
  currentEmployees: number;
  teachersNeededYear3: number;
  teachersDeficit: number;
  currentRatio: number;
  projectedRatioYear3: number;
  confidence: number | string;
  avgGrowthRate: number;
}
