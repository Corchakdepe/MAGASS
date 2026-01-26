// components/main-content.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useSimulationData,
  useCurrentRunId,
  useSimulationRuns,
} from "@/hooks/useSimulationHooks";
import type { MainContentMode } from "@/types/view-mode";
import type { AnalysisArtifact } from "@/types/core-data";
import  SummaryPanel  from "@/components/summary-panel";
import VisualizationsPanel from "@/components/visualizations-panel";
import type { GraphItem } from "@/components/visualizations-panel";
import { FiltersPanel } from "@/components/visualizationsFilters";
import  DashboardPanel  from "@/components/dashboard-panel";
import { API_BASE } from "@/lib/analysis/constants";

export type RawResultItem = {
  id: string;
  name: string;
  kind: "graph" | "map" | "matrix";
  format: "csv" | "json" | "html" | "png";
  url: string;
  api_full_url?: string;
  created?: string;
  meta?: Record<string, unknown>;
};

type MainContentProps = {
  simulationData?: { folder?: string } | null;
  triggerRefresh?: number;
  mode: MainContentMode;
  onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

export default function MainContent({
  simulationData: externalSimData,
  triggerRefresh,
  mode,
  onStationPick,
}: MainContentProps) {
  const { t } = useLanguage();

  // Use the new hooks
  const currentRunId = useCurrentRunId();
  const effectiveRunId = externalSimData?.folder ?? currentRunId ?? undefined;

  const {
    data: simulationContext,
    loading: isLoading,
    error,
    reload,
  } = useSimulationData(effectiveRunId);

  const { reload: reloadRuns } = useSimulationRuns();

  // Local state for artifacts filtered from context
  const [maps, setMaps] = useState<RawResultItem[]>([]);
  const [graphs, setGraphs] = useState<GraphItem[]>([]);
  const [chartsFromApi, setChartsFromApi] = useState<RawResultItem[]>([]);

  // Helper to convert artifacts to RawResultItem
  function artifactToRawItem(artifact: AnalysisArtifact): RawResultItem {
    return {
      id: artifact.id,
      name: artifact.name,
      kind: artifact.kind as "graph" | "map" | "matrix",
      format: artifact.format as "csv" | "json" | "html" | "png",
      url: artifact.url
        ? `results/${effectiveRunId}/${artifact.name}`
        : `${API_BASE}results/${effectiveRunId}/${artifact.name}`,
      api_full_url: artifact.url
        ? `${API_BASE}${artifact.url}`
        : `${API_BASE}results/${effectiveRunId}/${artifact.name}`,
      created: artifact.created,
      meta: artifact.metadata,
    };
  }

  // Extract artifacts from simulation context
  useEffect(() => {
    if (!simulationContext?.artifacts) {
      setMaps([]);
      setGraphs([]);
      setChartsFromApi([]);
      return;
    }

    // Filter maps based on mode
    if (mode === "analyticsMaps" || mode === "maps") {
      const mapArtifacts = Array.from(simulationContext.artifacts.maps.values())
        .map((artifact) => artifactToRawItem(artifact))
        .filter((x) => x.format === "html" || x.format === "png");
      setMaps(mapArtifacts);
    } else {
      setMaps([]);
    }

    // Filter graphs based on mode
    if (mode === "analyticsGraphs") {
      const graphArtifacts = Array.from(simulationContext.artifacts.graphs.values())
        .map((artifact) => artifactToRawItem(artifact))
        .filter((x) => x.format === "csv" || x.format === "json") as GraphItem[];
      setGraphs(graphArtifacts);
    } else {
      setGraphs([]);
    }

    // Charts from API (future use)
    setChartsFromApi([]);
  }, [simulationContext, mode, effectiveRunId]);

  // Refresh on trigger or mode change
  useEffect(() => {
    reload();
    reloadRuns();
  }, [triggerRefresh, mode, reload, reloadRuns]);

  // Loading state
  if (isLoading || !simulationContext) {
    return (
      <div className="flex h-full w-full min-w-0 items-center justify-center bg-surface-0 overflow-hidden">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" />
          <span>{t("loadingSimulationResults")}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (!simulationContext || !effectiveRunId) {
    return (
      <div className="flex h-full w-full min-w-0 items-center justify-center bg-surface-0 overflow-hidden">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-sm font-semibold text-text-primary">
            {t("noSimulationResults")}
          </div>
          <div className="text-xs text-text-secondary max-w-sm">
            {t("runSimulationToSeeResults")}
          </div>
        </div>
      </div>
    );
  }

  // Extract summary data from context
  const summaryData = simulationContext?.results?.summary
    ? {
        deltaMinutes: simulationContext.results.summary.deltaMinutes ?? 0,
        stressPercentage: simulationContext.results.summary.stressPercentage ?? 0,
        realPickupKms: simulationContext.results.summary.realPickupKms ?? 0,
        realDropoffKms: simulationContext.results.summary.realDropoffKms ?? 0,
        fictionalPickupKms: simulationContext.results.summary.fictionalPickupKms ?? 0,
        fictionalDropoffKms: simulationContext.results.summary.fictionalDropoffKms ?? 0,
        resolvedRealPickups: simulationContext.results.summary.resolvedRealPickups ?? 0,
        resolvedRealDropoffs: simulationContext.results.summary.resolvedRealDropoffs ?? 0,
        unresolvedRealPickups: simulationContext.results.summary.unresolvedRealPickups ?? 0,
        unresolvedRealDropoffs: simulationContext.results.summary.unresolvedRealDropoffs ?? 0,
        resolvedFictionalPickups:
          simulationContext.results.summary.resolvedFictionalPickups ?? 0,
        resolvedFictionalDropoffs:
          simulationContext.results.summary.resolvedFictionalDropoffs ?? 0,
        unresolvedFictionalPickups:
          simulationContext.results.summary.unresolvedFictionalPickups ?? 0,
        unresolvedFictionalDropoffs:
          simulationContext.results.summary.unresolvedFictionalDropoffs ?? 0,
      }
    : undefined;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {mode === "simulations" && summaryData && (
        <SummaryPanel kind="simulation" summaryData={summaryData} />
      )}

      {(mode === "analyticsGraphs" || mode === "analyticsMaps" || mode === "maps") && (
        <VisualizationsPanel
          mode={mode}
          apiBase={API_BASE}
          runId={effectiveRunId}
          simulationData={null}
          graphs={graphs}
          maps={maps}
          chartsFromApi={chartsFromApi}
          onStationPick={onStationPick}
        />
      )}

      {mode === "filters" && effectiveRunId && (
        <FiltersPanel apiBase={API_BASE} runId={effectiveRunId} />
      )}

      {mode === "dashboard" && effectiveRunId && (
        <DashboardPanel apiBase={API_BASE} runId={effectiveRunId} />
      )}
    </div>
  );
}
