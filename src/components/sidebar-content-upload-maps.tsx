// components/sidebar-content-upload-maps.tsx
'use client';

import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import type {SimulationData} from '@/types/simulation';
import StatisticsForm from '@/components/statistics-form';

type StationsTargetKey = 'mapa_densidad' | 'mapa_voronoi' | 'mapa_circulo';

type SidebarContentProps = {
    onSimulationComplete: (data: SimulationData | any) => void;
    runId?: string;
    externalStationsMaps?: Record<string, string>;
    activeStationsTargetKey?: StationsTargetKey;
    onActiveStationsTargetKeyChange?: (k: StationsTargetKey) => void;
};

export default function SidebarContentUploadMaps({
                                                     onSimulationComplete,
                                                     runId,
                                                     externalStationsMaps,
                                                     activeStationsTargetKey,
                                                     onActiveStationsTargetKeyChange,
                                                 }: SidebarContentProps) {
    const {toast} = useToast();
    const [isRunning] = useState(false); // reserved if you later want a global button

    return (
        <SidebarBody className="p-4 space-y-6 overflow-y-auto">
            <StatisticsForm
                runId={runId}
                externalStationsMaps={externalStationsMaps}
                activeStationsTargetKey={activeStationsTargetKey}
                onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
            />

        </SidebarBody>
    );
}