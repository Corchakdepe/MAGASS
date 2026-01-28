"use client";

import * as React from "react";
import {AlertCircle} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";
import {useDashboardMetrics} from "./hooks/useDashboardMetrics";
import type {DashboardPanelProps} from "./types/dashboard";
import {PrimaryMetricsSection} from "./components/PrimaryMetricsSection";
import {SuccessRatesSection} from "./components/SuccessRatesSection";
import {FictionalOperationsSection} from "./components/FictionalOperationsSection";
import {DistanceBreakdownSection} from "./components/DistanceBreakdownSection";

export function DashboardPanel({
  runId,
  summaryData,
  simulationContext,
}: DashboardPanelProps) {
  const {t} = useLanguage();
  const metrics = useDashboardMetrics(summaryData);

  if (!summaryData || !metrics) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-4" />
          <p className="text-text-primary mb-2">
            {t("noSummaryDataAvailable")}
          </p>
          <p className="text-xs text-text-secondary">
            {t("runSimulationToSeeDashboard")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-1">
          {t("simulationDashboard") || "Simulation Dashboard"}
        </h2>
        <p className="text-sm text-text-secondary">
          Run ID: <code className="font-mono text-accent text-xs">{runId}</code>
        </p>
      </div>

      <PrimaryMetricsSection summaryData={summaryData} metrics={metrics} t={t} />
      <SuccessRatesSection summaryData={summaryData} metrics={metrics} t={t} />
      <FictionalOperationsSection summaryData={summaryData} t={t} />
      <DistanceBreakdownSection metrics={metrics} t={t} />
    </div>
  );
}
