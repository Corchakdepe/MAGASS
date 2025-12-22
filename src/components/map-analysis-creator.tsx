"use client";

import * as React from "react";
import type {RawResultItem} from "@/components/main-content";
import VisualizationMaps from "@/components/visualizationsMaps";

type Props = {
    runId: string;
    apiBase: string;
    maps: RawResultItem[];
    onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
    onClearExternalStationsMaps?: () => void;
};

export default function MapAnalysisCreator({
                                               runId,
                                               apiBase,
                                               maps,
                                               onStationPick,
                                           }: Props) {
    return (
        <div className="">
                    <VisualizationMaps
                        runId={runId}
                        apiBase={apiBase}
                        maps={maps}
                        onStationPick={onStationPick}
                    />
        </div>
    );

}