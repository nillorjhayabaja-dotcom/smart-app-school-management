// Service layer — swap mock returns for apiRequest() calls when backend is live.
import { tokenStore } from "@/api/client";
import {
  mockEmployees, enrollmentForecast, retentionTrend, workloadByDept,
  teacherDistribution, activeVsInactive, riskHeatmap, performanceScatter,
  mockSchedule, mockRecommendations, mockAuditLogs,
} from "@/api/mock-data";
import type { User, Role } from "@/types";

const delay = <T>(d: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(d), ms));

export const authService = {
  async login(email: string, _password: string) {
    if (!email) throw new Error("Email required");
    const role: Role = email.includes("super") ? "super_admin"
      : email.includes("hr") ? "hr_admin"
      : email.includes("head") ? "department_head"
      : "viewer";
    const user: User = {
      id: "U-1", name: email.split("@")[0].replace(/\./g, " "),
      email, role, department: "Administration",
    };
    tokenStore.set(`mock.${btoa(email)}.${Date.now()}`, `refresh.${Date.now()}`);
    localStorage.setItem("wf.user", JSON.stringify(user));
    return delay(user);
  },
  async logout() { tokenStore.clear(); localStorage.removeItem("wf.user"); return delay(true); },
  async me(): Promise<User | null> {
    const raw = typeof window === "undefined" ? null : localStorage.getItem("wf.user");
    return delay(raw ? JSON.parse(raw) : null, 80);
  },
  async forgot(email: string) { if (!email) throw new Error("Email required"); return delay({ ok: true }); },
  async reset(_token: string, _password: string) { return delay({ ok: true }); },
};

export const employeeService = {
  list: () => delay(mockEmployees),
  get: (id: string) => delay(mockEmployees.find((e) => e.id === id) ?? null),
};

export const analyticsService = {
  enrollment: () => delay(enrollmentForecast),
  retention: () => delay(retentionTrend),
  workload: () => delay(workloadByDept),
  distribution: () => delay(teacherDistribution),
  activity: () => delay(activeVsInactive),
  risk: () => delay(riskHeatmap),
  performanceScatter: () => delay(performanceScatter),
};

export const recommendationService = { list: () => delay(mockRecommendations) };
export const schedulingService = { list: () => delay(mockSchedule) };
export const reportsService = {
  list: () => delay([
    { id: "RPT-1", name: "Q3 Workforce Allocation", type: "PDF", size: "1.2 MB", createdAt: new Date().toISOString() },
    { id: "RPT-2", name: "Retention Forecast — FY25", type: "XLSX", size: "642 KB", createdAt: new Date().toISOString() },
    { id: "RPT-3", name: "Department Performance Review", type: "PDF", size: "2.1 MB", createdAt: new Date().toISOString() },
  ]),
};
export const auditService = { list: () => delay(mockAuditLogs) };
