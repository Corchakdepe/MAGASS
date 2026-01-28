import {Clock, Activity, Route, Zap} from "lucide-react";
import {MetricCard} from "./MetricsCard";
import type {SummaryData} from "../hooks/useDashboardMetrics";
import type {DashboardMetrics} from "../hooks/useDashboardMetrics";

type PrimaryMetricsSectionProps = {
  summaryData: SummaryData;
  metrics: DashboardMetrics;
  t: (key: string) => string;
};

export function PrimaryMetricsSection({
  summaryData,
  metrics,
  t,
}: PrimaryMetricsSectionProps) {
  const primaryMetrics = [
    {
      label: t("simulationDuration") || "Simulation Duration",
      value: `${summaryData.deltaMinutes} min`,
      icon: <Clock className="h-5 w-5" />,
      subtext: "Total runtime",
      color: "text-blue-500",
    },
    {
      label: t("systemStress") || "System Stress",
      value: `${summaryData.stressPercentage.toFixed(1)}%`,
      icon: <Activity className="h-5 w-5" />,
      subtext: "Peak capacity usage",
      color: summaryData.stressPercentage > 80 ? "text-red-500" : "text-green-500",
    },
    {
      label: t("totalDistance") || "Total Distance",
      value: `${metrics.totalDistance.toFixed(1)} km`,
      icon: <Route className="h-5 w-5" />,
      subtext: `Avg ${metrics.avgDistancePerPickup.toFixed(2)} km/pickup`,
      color: "text-purple-500",
    },
    {
      label: t("totalOperations") || "Total Operations",
      value: metrics.totalOperations,
      icon: <Zap className="h-5 w-5" />,
      subtext: `${metrics.totalPickups} pickups, ${metrics.totalDropoffs} dropoffs`,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {primaryMetrics.map((metric, idx) => (
        <MetricCard key={idx} {...metric} />
      ))}
    </div>
  );
}
