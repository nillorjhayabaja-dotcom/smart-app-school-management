import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

interface InsightSummaryProps {
  title: string;
  body: string;
  recommendation?: ReactNode;
}

export function InsightSummary({ title, body, recommendation }: InsightSummaryProps) {
  return (
    <div className="mt-6 pt-4 border-t space-y-2">
      <div className="flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{body}</p>
          {recommendation && (
            <div className="mt-2 text-xs text-primary font-medium">
              {recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}