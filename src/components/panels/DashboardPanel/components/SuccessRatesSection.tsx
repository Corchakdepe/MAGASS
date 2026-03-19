import {MapPin, Navigation} from "lucide-react";
import {AnalysisCard} from "./AnalysisCard";
import type {SummaryData, DashboardMetrics} from "../hooks/useDashboardMetrics";

type SuccessRatesSectionProps = {
  summaryData: SummaryData;
  metrics: DashboardMetrics;
  t: (key: string) => string;
};

export function SuccessRatesSection({
  summaryData,
  metrics,
  t,
}: SuccessRatesSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <AnalysisCard
        title={t("realPickupAnalysis") || "Real Pickup Analysis"}
        icon={<MapPin className="h-4 w-4" />}
        iconColor="text-green-500"
        successRate={metrics.realPickupSuccessRate}
        successColor="text-green-500"
        resolved={summaryData.resolvedRealPickups}
        unresolved={summaryData.unresolvedRealPickups}
        distance={summaryData.realPickupKms}
      />
      <AnalysisCard
        title={t("realDropoffAnalysis") || "Real Dropoff Analysis"}
        icon={<Navigation className="h-4 w-4" />}
        iconColor="text-blue-500"
        successRate={metrics.realDropoffSuccessRate}
        successColor="text-blue-500"
        resolved={summaryData.resolvedRealDropoffs}
        unresolved={summaryData.unresolvedRealDropoffs}
        distance={summaryData.realDropoffKms}
      />
    </div>
  );
}
