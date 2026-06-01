/**
 * ML-Based Notification Generator
 * Automatically generates notifications from ML outputs and analytics data.
 * Integrates with enrollment forecasting, risk assessment, workforce allocation,
 * retention prediction, and recommendation engines.
 */

import { notificationService } from "./notifications";
import type { AppNotification, NotificationCategory, NotificationPriority } from "@/types/notifications";

// ── Helper: Delay ─────────────────────────────────────────────────────

const delay = <T>(d: T, ms = 100) => new Promise<T>((r) => setTimeout(() => r(d), ms));

// ── Workforce Notification Generators ─────────────────────────────────

export const mlNotificationGenerator = {
  /** Generate workforce notifications from employee data */
  async generateWorkforceNotifications(employees: any[]): Promise<void> {
    const threshold = 85;
    const overloaded = employees.filter((e) => e.workload > threshold);
    const underutilized = employees.filter((e) => e.workload < 40);

    for (const emp of overloaded) {
      await notificationService.create({
        user_id: null,
        title: `Teacher ${emp.name} exceeds workload threshold`,
        message: `Teacher ${emp.name}'s workload is at ${emp.workload}%, exceeding the ${threshold}% threshold. Consider workload redistribution.`,
        category: "workforce",
        priority: emp.workload > 100 ? "CRITICAL" : "HIGH",
        action_url: "/app/workload",
        metadata: { teacher_name: emp.name, workload: emp.workload, department: emp.department },
        target_department: emp.department,
      });
    }

    if (underutilized.length >= 2) {
      await notificationService.create({
        user_id: null,
        title: `${underutilized.length} teachers underutilized`,
        message: `${underutilized.length} teachers have workload below 40%. Consider redistributing assignments to optimize workforce allocation.`,
        category: "workforce",
        priority: "MEDIUM",
        action_url: "/app/allocation",
        metadata: { count: underutilized.length, teachers: underutilized.map((e) => e.name) },
      });
    }
  },

  /** Generate risk notifications from employee risk data */
  async generateRiskNotifications(employees: any[]): Promise<void> {
    const highRisk = employees.filter((e) => e.retentionRisk === "high");

    for (const emp of highRisk) {
      const burnoutScore = Math.round(60 + (100 - emp.performance) * 0.4 + emp.workload * 0.2);
      await notificationService.create({
        user_id: null,
        title: `High-risk teacher detected: ${emp.name}`,
        message: `Burnout probability: ${burnoutScore}%. Performance: ${emp.performance}%. Workload: ${emp.workload}%. Immediate intervention recommended.`,
        category: "risk",
        priority: burnoutScore > 80 ? "CRITICAL" : "HIGH",
        action_url: "/app/risk",
        metadata: { teacher_name: emp.name, burnout_score: burnoutScore, performance: emp.performance },
        target_department: emp.department,
      });
    }
  },

  /** Generate enrollment forecast notifications */
  async generateEnrollmentNotifications(forecastSummary: any): Promise<void> {
    const { growthPercentage, teachersDeficit, projectedRatioYear3, currentEmployees } = forecastSummary;

    if (growthPercentage > 10) {
      await notificationService.create({
        user_id: null,
        title: `Enrollment growth forecast: +${growthPercentage}%`,
        message: `Projected enrollment will grow by ${growthPercentage}% over 3 years. Current teacher-student ratio will reach ${projectedRatioYear3}:1 without additional hires.`,
        category: "enrollment",
        priority: growthPercentage > 15 ? "HIGH" : "MEDIUM",
        action_url: "/app/predictive",
        metadata: { growth_percentage: growthPercentage, projected_ratio: projectedRatioYear3 },
      });
    }

    if (teachersDeficit > 0) {
      await notificationService.create({
        user_id: null,
        title: `Teacher shortage predicted: ${teachersDeficit} teachers needed`,
        message: `Based on enrollment forecasts, ${teachersDeficit} additional teachers will be required by Year 3 to maintain educational quality standards.`,
        category: "enrollment",
        priority: teachersDeficit > 3 ? "CRITICAL" : "HIGH",
        action_url: "/app/predictive",
        metadata: { deficit: teachersDeficit, current_teachers: currentEmployees },
        target_role: "super_admin",
      });
    }
  },

  /** Generate scheduling conflict notifications */
  async generateSchedulingNotifications(schedule: any[]): Promise<void> {
    const conflicts = schedule.filter((s) => s.conflict);

    for (const conflict of conflicts) {
      await notificationService.create({
        user_id: null,
        title: `Schedule conflict: ${conflict.employeeName}`,
        message: `Schedule conflict detected for ${conflict.employeeName} on ${conflict.day} at ${conflict.start}. Room ${conflict.room} is double-booked.`,
        category: "scheduling",
        priority: "HIGH",
        action_url: "/app/scheduling",
        metadata: {
          teacher_name: conflict.employeeName,
          day: conflict.day,
          time: conflict.start,
          room: conflict.room,
        },
      });
    }
  },

  /** Generate recommendation notifications */
  async generateRecommendationNotifications(recommendations: any[]): Promise<void> {
    const highImpact = recommendations.filter((r) => r.impact === "high");

    for (const rec of highImpact) {
      await notificationService.create({
        user_id: null,
        title: `Recommendation: ${rec.title}`,
        message: `${rec.description} (Confidence: ${Math.round(rec.confidence * 100)}%)`,
        category: "recommendation",
        priority: "HIGH",
        action_url: "/app/recommendations",
        metadata: {
          recommendation_id: rec.id,
          category: rec.category,
          confidence: rec.confidence,
        },
      });
    }
  },

  /** Generate performance notifications */
  async generatePerformanceNotifications(employees: any[]): Promise<void> {
    const lowPerformance = employees.filter((e) => e.performance < 60);

    for (const emp of lowPerformance) {
      await notificationService.create({
        user_id: null,
        title: `Performance decline: ${emp.name}`,
        message: `Teacher ${emp.name}'s performance rating is ${emp.performance}%, below the 60% threshold. Training intervention recommended.`,
        category: "performance",
        priority: emp.performance < 50 ? "CRITICAL" : "HIGH",
        action_url: "/app/employees",
        metadata: { teacher_name: emp.name, performance: emp.performance },
        target_role: "hr_admin",
      });
    }
  },

  /** Run all ML notification generators */
  async generateAll(
    employees: any[],
    schedule: any[],
    recommendations: any[],
    forecastSummary?: any
  ): Promise<number> {
    const before = (await notificationService.getUnreadCount());
    
    await Promise.all([
      this.generateWorkforceNotifications(employees),
      this.generateRiskNotifications(employees),
      this.generateSchedulingNotifications(schedule),
      this.generateRecommendationNotifications(recommendations),
      this.generatePerformanceNotifications(employees),
    ]);

    if (forecastSummary) {
      await this.generateEnrollmentNotifications(forecastSummary);
    }

    const after = await notificationService.getUnreadCount();
    return after - before;
  },
};