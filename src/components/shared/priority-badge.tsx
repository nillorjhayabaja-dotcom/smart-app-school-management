import { cn } from "@/lib/utils";

type Priority = "critical" | "high" | "medium" | "low";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive" },
  high: { label: "High", className: "bg-warning/15 text-warning-foreground" },
  medium: { label: "Medium", className: "bg-info/15 text-info-foreground" },
  low: { label: "Low", className: "bg-success/15 text-success-foreground" },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
