import {MetricCard} from "./MetricCard";
import type {SummaryData, SummaryMetrics} from "../hooks/useSummaryMetrics";

type MetricsOverviewSectionProps = {
  summary: SummaryData;
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function MetricsOverviewSection({summary, metrics, t}: MetricsOverviewSectionProps) {
  const getSuccessVariant = (rate: number): "success" | "warning" | "error" => {
    if (rate >= 90) return "success";
    if (rate >= 70) return "warning";
    return "error";
  };

  return (
    <div className="space-y-6">
      {/* Time & System Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          {t("systemMetrics") || "System Metrics"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={t("deltaMinutes") || "Duration"}
            value={summary.deltaMinutes}
            unit="min"
            variant="default"
          />
          <MetricCard
            label={t("stressPercentage") || "System Stress"}
            value={summary.stressPercentage.toFixed(1)}
            unit="%"
            variant={summary.stressPercentage > 80 ? "error" : summary.stressPercentage > 50 ? "warning" : "success"}
          />
          <MetricCard
            label={t("totalOperations") || "Total Operations"}
            value={metrics.totalPickups + metrics.totalDropoffs}
            variant="default"
          />
          <MetricCard
            label={t("overallSuccessRate") || "Overall Success Rate"}
            value={metrics.overallSuccessRate.toFixed(1)}
            unit="%"
            variant={getSuccessVariant(metrics.overallSuccessRate)}
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          {t("quickStats") || "Quick Statistics"}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-3">
            <p className="text-xs text-text-secondary mb-1">{t("realOperations")}</p>
            <p className="text-xl font-bold text-text-primary">{metrics.totalRealOperations}</p>
          </div>
          <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-3">
            <p className="text-xs text-text-secondary mb-1">{t("fictionalOperations")}</p>
            <p className="text-xl font-bold text-text-primary">{metrics.totalFictionalOperations}</p>
          </div>
          <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-3">
            <p className="text-xs text-text-secondary mb-1">{t("rebalancing")} %</p>
            <p className="text-xl font-bold text-text-primary">{metrics.rebalancingIntensity.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-3">
            <p className="text-xs text-text-secondary mb-1">{t("avgDistance/Op")}</p>
            <p className="text-xl font-bold text-text-primary">{metrics.avgDistancePerOperation.toFixed(2)} km</p>
          </div>
        </div>
      </div>
    </div>
  );
}
