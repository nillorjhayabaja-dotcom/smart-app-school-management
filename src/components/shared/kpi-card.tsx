import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: number;
  hint?: string;
  comparison?: string;
  confidence?: number;
  context?: string;
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({ label, value, delta, hint, comparison, confidence, context, icon, className }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn(
      "rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      {(delta !== undefined || hint || comparison || confidence || context) && (
        <div className="mt-4 space-y-2 border-t pt-4">
           {delta !== undefined && (
            <div 
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 font-semibold text-sm text-white"
              style={{
                background: positive ? "var(--success)" : "var(--destructive)",
              }}
            >
              {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{positive ? "+" : ""}{delta}%</span>
            </div>
           )}
          {hint && <p className="text-xs text-muted-foreground font-medium">{hint}</p>}
          {comparison && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {comparison}
            </p>
          )}
          {confidence !== undefined && (
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center rounded px-2 py-1 bg-primary/10 text-primary font-semibold">
                {confidence}% confidence
              </span>
            </p>
          )}
          {context && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {context}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
