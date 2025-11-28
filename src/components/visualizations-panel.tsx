// components/visualizations-panel.tsx
'use client';

import type { SimulationData } from '@/types/simulation';
import VisualizationsGraphs from '@/components/visualizationsGraphs';
import VisualizationsMaps from '@/components/visualizationsMaps';
import Visualizations from '@/components/visualizations';
import type { MainContentMode } from '@/types/view-mode';
import type { RawResultItem as RawResultItemMain } from '@/components/main-content';

// Solo gráficos
export type GraphItem = RawResultItemMain & {
  kind: 'graph';
  format: 'csv' | 'json';
};

// Mapa simplificado
type MapItem = {
  id: string;
  name: string;
  kind: 'map';
  format: 'html' | 'png';
  url: string;
};

type VisualizationsPanelProps = {
  mode: MainContentMode;
  apiBase: string;
  runId: string | null;
  simulationData: SimulationData | null;
  graphs: GraphItem[];
  maps: RawResultItemMain[];
  chartsFromApi: any[];
};

export default function VisualizationsPanel({
  mode,
  apiBase,
  runId,
  simulationData,
  graphs,
  maps,
  chartsFromApi,
}: VisualizationsPanelProps) {
  if (!runId) return null;

  if (mode === 'simulations') {
    return <Visualizations simulationData={simulationData} />;
  }

  if (mode === 'analyticsGraphs') {
    if (chartsFromApi.length > 0) {
      return (
        <VisualizationsGraphs
          runId={runId}
          chartsFromApi={chartsFromApi as any}
        />
      );
    }
    return (
      <VisualizationsGraphs
        runId={runId}
        graphs={graphs}
        apiBase={apiBase}
      />
    );
  }

  if (mode === 'maps' || mode === 'analyticsMaps') {
    const mapItems: MapItem[] = maps
      .filter(
        m => m.kind === 'map' && (m.format === 'html' || m.format === 'png'),
      )
      .map(m => ({
        id: m.id,
        name: m.name,
        kind: 'map' as const,
        format: m.format as 'html' | 'png',
        url: m.api_full_url || `${apiBase}${m.url}`,
      }));

    return (
      <VisualizationsMaps
        runId={runId}
        maps={mapItems}
        apiBase={apiBase}
      />
    );
  }

  return null;
}
