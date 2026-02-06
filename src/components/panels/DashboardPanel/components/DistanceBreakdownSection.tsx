import {Percent} from "lucide-react";
import {ProgressBar} from "./ProgressBar";
import type {DashboardMetrics} from "../hooks/useDashboardMetrics";

type DistanceBreakdownSectionProps = {
  metrics: DashboardMetrics;
  t: (key: string) => string;
};

export function DistanceBreakdownSection({
  metrics,
  t,
}: DistanceBreakdownSectionProps) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t("distanceBreakdown") || "Distance Breakdown"}
      </h3>
      <div className="space-y-4">
        <ProgressBar
          label= {t("realOperations")}
          value={metrics.realDistance}
          percentage={metrics.realDistancePercentage}
          gradient="bg-gradient-to-r from-green-500 to-blue-500"
        />
        <ProgressBar
          label={t("fictionalOperations")}
          value={metrics.fictionalDistance}
          percentage={metrics.fictionalDistancePercentage}
          gradient="bg-gradient-to-r from-purple-500 to-pink-500"
        />
        <div className="pt-3 border-t border-surface-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-accent" />
              <span className="text-xs text-text-secondary">
               {t("realVsFictionalRatio")}
              </span>
            </div>
            <span className="text-lg font-bold text-accent">
              {metrics.realVsFictionalRatio}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            {t("higherIsBetterMoreRealOperationsVsRebalancing")}
          </p>
        </div>
      </div>
    </div>
  );
}
