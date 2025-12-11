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

type SidebarContentProps = {
    onSimulationComplete: (data: SimulationData | any) => void;
    runId?: string;
};

export default function SidebarContentUploadMaps({
                                                     onSimulationComplete,
                                                     runId,
                                                 }: SidebarContentProps) {
    const {toast} = useToast();
    const [isRunning] = useState(false); // reserved if you later want a global button

    return (
        <>
            <SidebarHeader className="p-4">
                <h2 className="text-xl font-semibold font-headline">Analysis</h2>
                <h3 className="text-s font-light font-headline">
                    Map creation parameters
                </h3>
            </SidebarHeader>
            <SidebarBody className="p-4 space-y-6 overflow-y-auto">
                <StatisticsForm runId={runId}/>
            </SidebarBody>
            <SidebarFooter className="p-4 border-t">
                {/* If you later want a single global "Run" button, wire it to StatisticsForm state */}
            </SidebarFooter>
        </>
    );
}