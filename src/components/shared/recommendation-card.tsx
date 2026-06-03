import { cn } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Priority = "critical" | "high" | "medium" | "low";

interface RecommendationCardProps {
  title: string;
  priority: Priority;
  confidence: number;
  impact: string;
  department?: string;
  action?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export function RecommendationCard({
  title,
  priority,
  confidence,
  impact,
  department,
  action,
  onAction,
  className,
}: RecommendationCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <PriorityBadge priority={priority} />
              <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="space-y-1.5">
        <div className="text-xs">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Impact:</span>{" "}
            {impact}
          </p>
        </div>
        {department && (
          <div className="text-xs">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Department:</span>{" "}
              {department}
            </p>
          </div>
        )}
      </div>

      {onAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="mt-3 w-full justify-between"
        >
          <span>View Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
