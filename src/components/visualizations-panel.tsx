// components/visualizations-panel.tsx
"use client";

import type { SimulationData } from "@/types/simulation";
import type { MainContentMode } from "@/types/view-mode";
import VisualizationGraphs from "@/components/visualizationsGraphs/components/visualizationsGraphs";
import VisualizationMaps from "@/components/vizualizationsMaps/components/visualizationsMaps";
import type { RawResultItem } from "@/components/main-content";
import { useLanguage } from "@/contexts/LanguageContext";

export type GraphItem = RawResultItem;

type VisualizationsPanelProps = {
  mode: MainContentMode;
  apiBase: string;
  runId: string;
  simulationData: SimulationData | null;
  graphs: GraphItem[];
  maps: RawResultItem[];
  chartsFromApi?: any[];
  onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

export default function VisualizationsPanel({
  mode,
  apiBase,
  runId,
  graphs,
  maps,
  chartsFromApi,
  onStationPick,
}: VisualizationsPanelProps) {
  const { t } = useLanguage();

  const showGraphs = mode === "analyticsGraphs";
  const showMaps = mode === "analyticsMaps" || mode === "maps";

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top-level panel with run info */}
      <div className="flex-1 flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">


        {/* Content Area - Full height */}
        <div className="flex-1 overflow-hidden">
          {showGraphs && (
            <div className="h-full w-full">
              <VisualizationGraphs
                runId={runId}
                apiBase={apiBase}
                graphs={graphs}
                chartsFromApi={chartsFromApi}
              />
            </div>
          )}

          {showMaps && (
            <div className="h-full w-full">
              <VisualizationMaps
                runId={runId}
                apiBase={apiBase}
                maps={maps}
                onStationPick={onStationPick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
