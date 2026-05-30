import type { Employee, ScheduleEntry, Recommendation, AuditLog } from "@/types";

const departments = ["Mathematics", "Sciences", "Languages", "Humanities", "Arts", "PE"];
const skillsPool = ["Algebra", "Calculus", "Physics", "Chemistry", "Biology", "Literature", "ESL", "History", "Economics", "Music", "Art", "Coaching", "Curriculum Design", "Assessment"];
const firstNames = ["Aria","Liam","Maya","Noah","Sofia","Ethan","Zara","Owen","Iris","Kai","Luna","Mateo","Nora","Eli","Ava","Leo","Mira","Jude","Sage","Theo"];
const lastNames = ["Reyes","Cruz","Santos","Garcia","Lopez","Mendez","Tan","Lim","Yu","Castro","Diaz","Bautista","Morales","Navarro","Aquino"];

function pick<T>(arr: T[], n = 1): T[] {
  const c = [...arr].sort(() => Math.random() - 0.5);
  return c.slice(0, n);
}

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
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

// --- UNIFIED ENROLLMENT DATA ---
// Single source of truth used by Dashboard, Predictive Analytics, and Recommendations
const currentYear = new Date().getFullYear();

// Historical enrollment data (10 years) — deterministic using seeded random
const rand = seededRandom(42);
const historicalEnrollment: { year: number; enrollment: number }[] = [];
const histBaseEnrollment = 1180;
const histGrowthRates = [0.028, 0.032, 0.031, 0.038, 0.029, 0.042, 0.035, 0.037, 0.041, 0.036];
for (let i = 0; i < 10; i++) {
  const year = currentYear - 9 + i;
  const trend = histBaseEnrollment * (1 + histGrowthRates.slice(0, i + 1).reduce((a, b) => a * (1 + b), 1) - 1);
  const variation = Math.round((rand() - 0.5) * 60);
  historicalEnrollment.push({
    year,
    enrollment: Math.round(trend + variation),
  });
}

// Shared enrollment forecast used by BOTH Dashboard and Predictive pages
export const enrollmentForecast = historicalEnrollment.map((d) => ({
  year: String(d.year),
  actual: d.enrollment,
  forecast: d.enrollment,
}));

// Linear regression for trend projection
function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumXX = data.reduce((s, d) => s + d.x * d.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const regData = historicalEnrollment.map((d) => ({ x: d.year, y: d.enrollment }));
const { slope, intercept } = linearRegression(regData);

// Calculate R² for confidence
const meanY = historicalEnrollment.reduce((s, d) => s + d.enrollment, 0) / historicalEnrollment.length;
const ssTot = historicalEnrollment.reduce((s, d) => s + (d.enrollment - meanY) ** 2, 0);
const ssRes = historicalEnrollment.reduce((s, d) => {
  const predicted = slope * d.year + intercept;
  return s + (d.enrollment - predicted) ** 2;
}, 0);
const rSquared = 1 - ssRes / ssTot;

// Historical employee count (slight growth over years)
const historicalEmployees: { year: number; count: number }[] = [];
for (let i = 0; i < 10; i++) {
  const year = currentYear - 9 + i;
  const baseCount = 38;
  const growth = i < 7 ? Math.floor(i * 1.2) : Math.floor(7 * 1.2) + Math.floor((i - 7) * 0.5);
  historicalEmployees.push({ year, count: baseCount + growth });
}
const lastYearEmployees = historicalEmployees[historicalEmployees.length - 1].count; // 48

// Generate 3-year forecast
const forecastYears = 3;
export const enrollmentForecast3Year: {
  year: number;
  historical: number | null;
  predicted: number;
  optimistic: number;
  conservative: number;
  employees: number;
  teachersNeeded: number;
  teacherStudentRatio: number;
  employeeSurplus: number;
}[] = [];

// Average annual growth rate from recent 3 years
const recentGrowthRates = histGrowthRates.slice(-3);
const avgGrowthRate = recentGrowthRates.reduce((a, b) => a + b, 0) / recentGrowthRates.length;

for (let i = 0; i < 10 + forecastYears; i++) {
  const year = currentYear - 9 + i;
  const isHistorical = i < 10;

  if (isHistorical) {
    const empGrowth = i < 7 ? Math.floor(i * 1.2) : Math.floor(7 * 1.2) + Math.floor((i - 7) * 0.5);
    const empCount = 38 + empGrowth;
    const ratio = historicalEnrollment[i].enrollment / empCount;
    enrollmentForecast3Year.push({
      year,
      historical: historicalEnrollment[i].enrollment,
      predicted: historicalEnrollment[i].enrollment,
      optimistic: historicalEnrollment[i].enrollment,
      conservative: historicalEnrollment[i].enrollment,
      employees: empCount,
      teachersNeeded: Math.ceil(historicalEnrollment[i].enrollment / 38), // At 1:38 ratio
      teacherStudentRatio: Math.round(ratio * 10) / 10,
      employeeSurplus: empCount - Math.ceil(historicalEnrollment[i].enrollment / 38),
    });
  } else {
    // Predict using linear regression + growth acceleration
    const yearsAhead = i - 9;
    const baseProjection = slope * year + intercept;
    // Apply growth acceleration factor
    const accelerationFactor = 1 + (avgGrowthRate * yearsAhead * 0.15);
    
    const predicted = Math.round(baseProjection * accelerationFactor);
    const optimistic = Math.round(predicted * 1.06); // +6% optimistic
    const conservative = Math.round(predicted * 0.94); // -6% conservative
    
    // Employee count stays same as last year (the key analysis point)
    const employees = lastYearEmployees;
    const teachersNeeded = Math.ceil(predicted / 38); // At 1:38 ratio (PH average)
    const ratio = predicted / employees;
    const employeeSurplus = employees - teachersNeeded; // Negative means deficit
    
    enrollmentForecast3Year.push({
      year,
      historical: null,
      predicted,
      optimistic,
      conservative,
      employees,
      teachersNeeded,
      teacherStudentRatio: Math.round(ratio * 10) / 10,
      employeeSurplus,
    });
  }
}

// Calculate key metrics for the 3-year forecast
const lastHistoricalEnrollment = historicalEnrollment[historicalEnrollment.length - 1].enrollment;
const year3Forecast = enrollmentForecast3Year[enrollmentForecast3Year.length - 1];
const totalGrowth = year3Forecast.predicted - lastHistoricalEnrollment;
const growthPercentage = ((totalGrowth / lastHistoricalEnrollment) * 100).toFixed(1);
const teachersDeficit = Math.abs(Math.min(0, year3Forecast.employeeSurplus));
const optimalRatioYear3 = year3Forecast.teacherStudentRatio;

export const enrollmentForecastSummary = {
  currentEnrollment: lastHistoricalEnrollment,
  projectedYear1: enrollmentForecast3Year.find((d) => d.year === currentYear + 1)?.predicted ?? 0,
  projectedYear2: enrollmentForecast3Year.find((d) => d.year === currentYear + 2)?.predicted ?? 0,
  projectedYear3: year3Forecast.predicted,
  totalGrowth,
  growthPercentage: parseFloat(growthPercentage),
  currentEmployees: lastYearEmployees,
  teachersNeededYear3: year3Forecast.teachersNeeded,
  teachersDeficit,
  currentRatio: lastHistoricalEnrollment / lastYearEmployees,
  projectedRatioYear3: optimalRatioYear3,
  confidence: Math.round(rSquared * 100),
  avgGrowthRate: parseFloat((avgGrowthRate * 100).toFixed(1)),
};

// Planning recommendations based on analysis
export const planningRecommendations: {
  id: string;
  category: "hiring" | "infrastructure" | "budget" | "training" | "risk";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  timeline: string;
  estimatedCost?: string;
}[] = [
  {
    id: "PR-1",
    category: "hiring",
    priority: "critical",
    title: `Hire ${teachersDeficit} Additional Teachers by ${currentYear + 2}`,
    description: `Current enrollment-to-teacher ratio will reach ${optimalRatioYear3}:1 by Year 3, significantly exceeding the Philippine DepEd standard of 1:36–1:40. Hiring ${teachersDeficit} teachers over the next 2 years is critical to maintain educational quality.`,
    impact: "Prevents ratio from exceeding 1:50, maintains accreditation compliance",
    timeline: `Recruitment should begin Q1 ${currentYear + 1}, with hires onboarded by Q3 ${currentYear + 1}`,
    estimatedCost: `₱${(teachersDeficit * 360000).toLocaleString()} annually (based on average teacher salary of ₱30,000/month)`,
  },
  {
    id: "PR-2",
    category: "infrastructure",
    priority: "high",
    title: `Prepare ${Math.ceil(totalGrowth / 40)} Additional Classrooms`,
    description: `With ${totalGrowth} additional students projected over 3 years, approximately ${Math.ceil(totalGrowth / 40)} new classrooms are needed (assuming 40 students per classroom).`,
    impact: "Ensures physical capacity matches enrollment growth",
    timeline: `Construction/renovation should start by mid-${currentYear + 1}`,
    estimatedCost: `₱${(Math.ceil(totalGrowth / 40) * 850000).toLocaleString()} (estimated ₱850,000 per classroom renovation)`,
  },
  {
    id: "PR-3",
    category: "budget",
    priority: "high",
    title: "Increase Annual Operating Budget by 8–12%",
    description: `Enrollment growth of ${growthPercentage}% over 3 years requires proportional increases in textbooks, learning materials, utilities, and maintenance.`,
    impact: "Prevents resource dilution and maintains student-to-material ratios",
    timeline: `Budget proposal should be submitted for FY ${currentYear + 1} planning cycle`,
  },
  {
    id: "PR-4",
    category: "training",
    priority: "medium",
    title: "Implement Teacher Training Program for Class Size Management",
    description: "With potential class sizes increasing, train existing teachers on differentiated instruction, classroom management for larger groups, and technology-assisted teaching.",
    impact: "Maintains educational quality despite larger class sizes during transition period",
    timeline: `Training sessions to begin Q2 ${currentYear + 1}`,
  },
  {
    id: "PR-5",
    category: "risk",
    priority: "high",
    title: "Address Teacher Burnout Risk",
    description: `If enrollment grows without proportional hiring, remaining teachers will absorb ${Math.round(totalGrowth / lastYearEmployees)} additional students each on average. This increases workload by ${Math.round((totalGrowth / lastYearEmployees / (lastHistoricalEnrollment / lastYearEmployees)) * 100)}% and significantly raises burnout and turnover risk.`,
    impact: "Prevents cascading teacher resignations and quality deterioration",
    timeline: "Immediate action required — monitor workload metrics monthly",
  },
  {
    id: "PR-6",
    category: "infrastructure",
    priority: "medium",
    title: "Upgrade IT Infrastructure and Digital Learning Platforms",
    description: "Scale digital resources and learning management systems to support larger student body. Consider e-learning modules to optimize teacher capacity.",
    impact: "Enables blended learning that effectively increases teaching capacity by 15–20%",
    timeline: `Technology assessment by Q1 ${currentYear + 1}, deployment by Q3 ${currentYear + 1}`,
    estimatedCost: `₱${Math.round(totalGrowth * 2500).toLocaleString()} (estimated ₱2,500 per student for digital infrastructure)`,
  },
];

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