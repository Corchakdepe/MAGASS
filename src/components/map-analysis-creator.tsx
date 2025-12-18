'use client';

import * as React from 'react';
import type {RawResultItem} from '@/components/main-content';
import VisualizationMaps from '@/components/visualizationsMaps';

type Props = {
    runId: string;
    apiBase: string;
    maps: RawResultItem[];
    onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

export default function MapAnalysisCreator({runId, apiBase, maps, onStationPick}: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisualizationMaps
                runId={runId}
                apiBase={apiBase}
                maps={maps}
                onStationPick={onStationPick}
            />
        </div>
    );
}
