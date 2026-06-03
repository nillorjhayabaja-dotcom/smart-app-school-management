/**
 * Chart styling utilities for dark mode compatibility
 * Ensures all Recharts visualizations render correctly in both light and dark modes
 */

// Tooltip styling that respects theme with enhanced dark mode visibility
export const getTooltipStyle = () => ({
  background: "color-mix(in srgb, var(--popover) 92%, black)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--foreground)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
  padding: "8px 12px",
  zIndex: 1000,
});

// Axis styling for charts
export const getAxisStyle = () => ({
  stroke: "var(--muted-foreground)",
  fontSize: 11,
});

// Grid styling
export const getGridStyle = () => ({
  strokeDasharray: "3 3",
  stroke: "var(--border)",
});

// Legend styling for pie charts
export const getLegendStyle = () => ({
  fontSize: 11,
  paddingTop: 16,
  color: "var(--foreground)",
});

export default {
  getTooltipStyle,
  getAxisStyle,
  getGridStyle,
  getLegendStyle,
};
