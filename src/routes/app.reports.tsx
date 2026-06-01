/**
 * Reports Center — Enterprise reporting module.
 * Provides comprehensive analytics, forecasting, and decision-support reports
 * including executive summaries, enrollment forecasts, retention analysis,
 * workforce allocation, performance analysis, risk assessment, skill gap,
 * scheduling efficiency, recommendations, predictive analytics, and audit logs.
 */

import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/reports/reports-page";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});