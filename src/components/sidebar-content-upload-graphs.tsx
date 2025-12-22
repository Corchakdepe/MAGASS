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
    onSimulationComplete: (data: SimulationData) => void;
    runId?: string;
};


export default function SidebarContentUploadMaps({
                                                     onSimulationComplete,
                                                     runId
                                                 }: SidebarContentProps) {
    const {toast} = useToast();
    const [isRunning, setIsRunning] = useState(false);

    const handleRunAnalysis = async () => {


        setIsRunning(true);

        try {
            const body = {
                run: runId || undefined,  // NEW
                seleccionagregacion: -1,
            };

            const response = await fetch('http://127.0.0.1:8000/exe/analizar-json', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Analysis failed');
            }

            const result = await response.json();
            onSimulationComplete(result);

            toast({
                title: 'Analysis Complete',
                description: 'Analysis finished successfully',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Analysis failed',
            });
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <>
            <SidebarHeader className="p-4 border-b border-surface-3 bg-surface-1/85 backdrop-blur-md">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold font-headline text-text-primary">
                        Analysis
                    </h2>
                    <p className="text-[11px] text-text-secondary">
                        Map creation parameters
                    </p>
                </div>
            </SidebarHeader>

            <SidebarBody className="p-4 space-y-6 overflow-y-auto bg-surface-1/70 backdrop-blur-md">
                {/* StatisticsForm should expose input_folder and output_folder */}
                <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3">
                    <StatisticsForm/>
                </div>
            </SidebarBody>

            {/* Optional footer area (kept empty to avoid nested panels unless you want a status row) */}
            <SidebarFooter className="p-4 border-t border-surface-3 bg-surface-1/85 backdrop-blur-md">
                <div className="text-[11px] text-text-secondary">
                    {runId ? `Run: ${runId}` : "No run selected"}
                </div>
            </SidebarFooter>
        </>
    );

}
