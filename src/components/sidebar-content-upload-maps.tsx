'use client';

import {SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import type {SimulationData} from '@/types/simulation';
import StatisticsForm from '@/components/statistics-form';

type SidebarContentProps = {
    onSimulationComplete: (data: SimulationData | any) => void;
    runId?: string;
    externalStationsMaps?: Record<string, string>;
};

export default function SidebarContentUploadMaps({
                                                     runId,
                                                     externalStationsMaps,
                                                 }: SidebarContentProps) {
    return (
        <SidebarBody className="p-4 space-y-6 overflow-y-auto bg-surface-1/70 backdrop-blur-md">
                <StatisticsForm runId={runId} externalStationsMaps={externalStationsMaps}/>
        </SidebarBody>
    );

}
