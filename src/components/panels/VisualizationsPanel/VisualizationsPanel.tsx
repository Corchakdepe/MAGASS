"use client";

import * as React from "react";
import VisualizationGraphs from "@/components/visualizationsGraphs/components/visualizationsGraphs";
import VisualizationMaps from "@/components/vizualizationsMaps/components/visualizationsMaps";
import type {VisualizationsPanelProps} from "@/components/panels";
import VisualizationStatisticsAnalyzerPanel from "@/components/visualizationsStatisticsAnalyzer/visualizationsStatisticsAnalyzer";
import VisualizationsDirComparison from "@/components/visualizationsDifComparison/visualizationsDirComparison";

export function VisualizationsPanel({
  mode,
  apiBase,
  runId,
  graphs,
  maps,
  chartsFromApi,
  onStationPick,
}: VisualizationsPanelProps) {
  const showGraphs = mode === "analyticsGraphs";
  const showMaps = mode === "analyticsMaps" || mode === "maps";
  const showStatistics = mode === "statisticsAnalyzer";
  const showDirComparison = mode === "dirComparison";
  return (
    <div className="h-full w-full overflow-auto">
      {showGraphs && (
        <VisualizationGraphs
          apiBase={apiBase}
          runId={runId}
          graphs={graphs}
          chartsFromApi={chartsFromApi}
        />
      )}
      {showMaps && (
        <VisualizationMaps
          apiBase={apiBase}
          runId={runId}
          maps={maps}
          onStationPick={onStationPick}
        />
      )}
      {showStatistics && (
        <VisualizationStatisticsAnalyzerPanel/>
      )}
      {showDirComparison &&(
          <VisualizationsDirComparison/>
      )}
    </div>
  );
}
