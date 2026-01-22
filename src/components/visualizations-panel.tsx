// components/visualizations-panel.tsx
'use client';

import type {SimulationData} from '@/types/simulation';
import type {MainContentMode} from '@/types/view-mode';
import VisualizationGraphs from '@/components/visualizationsGraphs';
import VisualizationMaps from '@/components/visualizationsMaps';
import type {RawResultItem} from '@/components/main-content';
import {useLanguage} from '@/contexts/LanguageContext';

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
    const {t} = useLanguage();
    const showGraphs = mode === 'analyticsGraphs';
    const showMaps = mode === 'analyticsMaps';
    const showMapsList = mode === 'maps';

    return (
        <div className="space-y-4">
            {/* Top-level Apple panel */}
            <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-xs font-semibold text-text-primary">{t('visualizations')}</div>
                        <div className="text-[11px] text-text-secondary">
                            {showGraphs ? t('graphs') : showMaps ? t('maps') : t('mapsList')}
                        </div>
                    </div>

                    <div className="shrink-0 rounded-md bg-accent-soft px-2 py-1 text-[11px] text-accent">
                        {t('run')}: {runId}
                    </div>
                </div>

                <div className="mt-4 space-y-4">
                    {showGraphs && (
                        <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3">
                            <VisualizationGraphs runId={runId} apiBase={apiBase} graphs={graphs}/>
                        </div>
                    )}

                    {showMaps && (
                        <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3">
                            <VisualizationMaps runId={runId} apiBase={apiBase} maps={maps}/>
                        </div>
                    )}

                    {showMapsList && (
                        <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3">
                            <VisualizationMaps runId={runId} apiBase={apiBase} maps={maps}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
