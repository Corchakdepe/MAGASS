import type {SummaryData} from "../hooks/useDashboardMetrics";

type FictionalOperationsSectionProps = {
  summaryData: SummaryData;
  t: (key: string) => string;
};

export function FictionalOperationsSection({
  summaryData,
  t,
}: FictionalOperationsSectionProps) {
  const operations = [
    {label: "Resolved Pickups", value: summaryData.resolvedFictionalPickups},
    {label: "Unresolved Pickups", value: summaryData.unresolvedFictionalPickups},
    {label: "Resolved Dropoffs", value: summaryData.resolvedFictionalDropoffs},
    {label: "Unresolved Dropoffs", value: summaryData.unresolvedFictionalDropoffs},
  ];

  const distances = [
    {label: "Pickup Distance", value: summaryData.fictionalPickupKms},
    {label: "Dropoff Distance", value: summaryData.fictionalDropoffKms},
  ];

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5 mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t("fictionalOperations") || "Fictional Operations (Rebalancing)"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {operations.map((op, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs text-text-secondary mb-1">{op.label}</p>
            <p className="text-xl font-bold text-text-primary">{op.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-surface-3">
        {distances.map((dist, idx) => (
          <div key={idx}>
            <p className="text-xs text-text-secondary mb-1">{dist.label}</p>
            <p className="text-lg font-bold text-text-primary">
              {dist.value.toFixed(2)} km
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
