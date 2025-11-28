// components/visualizations-panel.tsx
'use client';

import type {SimulationData} from '@/types/simulation';
import type {MainContentMode} from '@/types/view-mode';
import VisualizationGraphs from '@/components/visualizationsGraphs';
import VisualizationMaps from '@/components/visualizationsMaps';
import type {RawResultItem} from '@/components/main-content';

export type GraphItem = RawResultItem & {
    // extend later if needed
};

type VisualizationsPanelProps = {
    mode: MainContentMode;
    apiBase: string;
    runId: string;
    simulationData: SimulationData | null;
    graphs: GraphItem[];
    maps: RawResultItem[];
    chartsFromApi: any[];
};

export default function VisualizationsPanel({
                                                mode,
                                                apiBase,
                                                runId,
                                                graphs,
                                                maps,
                                                chartsFromApi,
                                            }: VisualizationsPanelProps) {
    const showGraphs = mode === 'analyticsGraphs';
    const showMaps = mode === 'maps' || mode === 'analyticsMaps';

    return (

        <div className="space-y-6">
            {showGraphs && (
                <VisualizationGraphs
                    runId={runId}
                    apiBase={apiBase}
                    graphs={graphs}
                    // remove chartsFromApi here
                />
            )}

            {showMaps && (
                <VisualizationMaps
                    runId={runId}
                    apiBase={apiBase}
                    maps={maps}
                />
            )}
        </div>
    );
}
