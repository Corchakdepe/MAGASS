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
      subtext: t("totalRunTime"),
      color: "rgba(0,122,255,1)",
    },
    {
      label: t("systemStress") || "System Stress",
      value: `${summaryData.stressPercentage.toFixed(1)}%`,
      icon: <Activity className="h-5 w-5" />,
      subtext: t("peakCapacityUsage"),
      color: summaryData.stressPercentage > 80 ? "rgba(255,149,0,1)" : "rgba(52,199,89,1)",
    },
    {
      label: t("totalDistance") || "Total Distance",
      value: `${metrics.totalDistance.toFixed(1)} km`,
      icon: <Route className="h-5 w-5" />,
      subtext: `Avg ${metrics.avgDistancePerPickup.toFixed(2)} km/pickup`,
      color: "rgba(0,122,255,1)",
    },
    {
      label: t("totalOperations") || "Total Operations",
      value: metrics.totalOperations,
      icon: <Zap className="h-5 w-5" />,
      subtext: `${metrics.totalPickups} pickups, ${metrics.totalDropoffs} dropoffs`,
      color: "rgba(255,149,0,1)",
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
