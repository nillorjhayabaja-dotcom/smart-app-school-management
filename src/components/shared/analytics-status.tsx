import { Clock, Activity, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsStatusProps {
  forecastUpdated?: string; // e.g., "2 hours ago"
  modelAccuracy?: number; // e.g., 94
  dataFreshness?: string; // e.g., "Current Semester"
  className?: string;
}

export function AnalyticsStatus({
  forecastUpdated,
  modelAccuracy,
  dataFreshness,
  className,
}: AnalyticsStatusProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-3 text-xs text-muted-foreground",
        className
      )}
    >
      {forecastUpdated && (
        <div className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Forecast updated {forecastUpdated}</span>
        </div>
      )}
      {modelAccuracy !== undefined && (
        <div className="inline-flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          <span>Model Accuracy: {modelAccuracy}%</span>
        </div>
      )}
      {dataFreshness && (
        <div className="inline-flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          <span>Data: {dataFreshness}</span>
        </div>
      )}
    </div>
  );
}
