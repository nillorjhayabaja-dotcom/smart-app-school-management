import type { Employee, ScheduleEntry, Recommendation, AuditLog } from "@/types";

const departments = ["Mathematics", "Sciences", "Languages", "Humanities", "Arts", "PE"];
const skillsPool = ["Algebra", "Calculus", "Physics", "Chemistry", "Biology", "Literature", "ESL", "History", "Economics", "Music", "Art", "Coaching", "Curriculum Design", "Assessment"];
const firstNames = ["Aria","Liam","Maya","Noah","Sofia","Ethan","Zara","Owen","Iris","Kai","Luna","Mateo","Nora","Eli","Ava","Leo","Mira","Jude","Sage","Theo"];
const lastNames = ["Reyes","Cruz","Santos","Garcia","Lopez","Mendez","Tan","Lim","Yu","Castro","Diaz","Bautista","Morales","Navarro","Aquino"];

function pick<T>(arr: T[], n = 1): T[] {
  const c = [...arr].sort(() => Math.random() - 0.5);
  return c.slice(0, n);
}

export const mockEmployees: Employee[] = Array.from({ length: 48 }).map((_, i) => {
  const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
  const workload = Math.round(40 + Math.random() * 60);
  const perf = Math.round(55 + Math.random() * 45);
  const risk = perf < 65 || workload > 90 ? "high" : perf < 80 ? "medium" : "low";
  return {
    id: `EMP-${1000 + i}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@school.edu`,
    role: ["Teacher", "Sr. Teacher", "Coordinator", "Dept. Head"][i % 4],
    department: departments[i % departments.length],
    status: i % 9 === 0 ? "inactive" : i % 11 === 0 ? "on_leave" : "active",
    workload,
    performance: perf,
    retentionRisk: risk,
    skills: pick(skillsPool, 3 + (i % 3)),
    joinedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 6).toISOString(),
  };
});

export const enrollmentForecast = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  actual: i < 8 ? 1800 + Math.round(Math.sin(i / 2) * 120 + i * 30) : null,
  forecast: 1800 + Math.round(Math.sin(i / 2) * 120 + i * 30) + (i >= 7 ? 60 : 0),
}));

export const retentionTrend = Array.from({ length: 8 }).map((_, i) => ({
  term: `T${i + 1}`,
  retention: Math.round(82 + Math.random() * 12),
  predicted: Math.round(84 + Math.random() * 10),
}));

export const workloadByDept = departments.map((d) => ({
  department: d,
  workload: Math.round(50 + Math.random() * 45),
  capacity: 100,
}));

export const teacherDistribution = departments.map((d) => ({
  name: d,
  value: Math.round(6 + Math.random() * 12),
}));

export const activeVsInactive = [
  { name: "Active", value: mockEmployees.filter((e) => e.status === "active").length },
  { name: "On Leave", value: mockEmployees.filter((e) => e.status === "on_leave").length },
  { name: "Inactive", value: mockEmployees.filter((e) => e.status === "inactive").length },
];

export const riskHeatmap = departments.map((d) => ({
  department: d,
  low: Math.round(Math.random() * 8 + 2),
  medium: Math.round(Math.random() * 6 + 1),
  high: Math.round(Math.random() * 4),
}));

export const performanceScatter = mockEmployees.slice(0, 30).map((e) => ({
  workload: e.workload,
  performance: e.performance,
  name: e.name,
}));

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const subjects = ["Algebra I", "Biology", "World History", "English Lit", "Physics", "Art Studio", "PE", "Calculus"];

export const mockSchedule: ScheduleEntry[] = Array.from({ length: 36 }).map((_, i) => {
  const emp = mockEmployees[i % mockEmployees.length];
  const start = 8 + (i % 6);
  return {
    id: `SCH-${i}`,
    employeeId: emp.id,
    employeeName: emp.name,
    day: days[i % 5],
    start: `${String(start).padStart(2, "0")}:00`,
    end: `${String(start + 1).padStart(2, "0")}:00`,
    subject: subjects[i % subjects.length],
    room: `R-${100 + (i % 20)}`,
    conflict: i % 13 === 0,
  };
});

export const mockRecommendations: Recommendation[] = [
  { id: "R1", title: "Rebalance Mathematics workload", category: "allocation", impact: "high", confidence: 0.91, description: "Move 2 sections from Reyes (98%) to Cruz (62%) to reduce burnout risk.", createdAt: new Date().toISOString() },
  { id: "R2", title: "Upskill 3 teachers in ESL", category: "training", impact: "medium", confidence: 0.78, description: "Enrollment forecast shows 18% ESL demand growth next term.", createdAt: new Date().toISOString() },
  { id: "R3", title: "Retention intervention — Sciences", category: "retention", impact: "high", confidence: 0.84, description: "4 teachers flagged high-risk based on workload + tenure signals.", createdAt: new Date().toISOString() },
  { id: "R4", title: "Resolve Tue 10:00 room conflict", category: "scheduling", impact: "low", confidence: 0.97, description: "Two classes booked in R-104. Suggest moving Physics to R-211.", createdAt: new Date().toISOString() },
  { id: "R5", title: "Hire 1 Humanities coordinator", category: "allocation", impact: "medium", confidence: 0.7, description: "Projected coverage gap of 0.6 FTE in next 2 terms.", createdAt: new Date().toISOString() },
];

export const mockAuditLogs: AuditLog[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `LOG-${i}`,
  actor: ["admin@school.edu", "hr@school.edu", "head@school.edu"][i % 3],
  action: ["LOGIN", "UPDATE_EMPLOYEE", "RUN_FORECAST", "EXPORT_REPORT", "EDIT_SCHEDULE"][i % 5],
  target: ["session", `EMP-${1000 + (i % 48)}`, "ML-pipeline", "Q3-report.pdf", `SCH-${i}`][i % 5],
  at: new Date(Date.now() - i * 1000 * 60 * 47).toISOString(),
  ip: `10.0.${i % 255}.${(i * 7) % 255}`,
}));
