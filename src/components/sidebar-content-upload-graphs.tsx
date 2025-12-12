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
            <SidebarHeader className="p-4">
                <h2 className="text-xl font-semibold font-headline">Analysis</h2>
                <h3 className="text-s font-light font-headline">
                    Map creation parameters
                </h3>
            </SidebarHeader>
            <SidebarBody className="p-4 space-y-6 overflow-y-auto">
                {/* StatisticsForm debería exponer input_folder y output_folder */}
                <StatisticsForm/>
            </SidebarBody>
            <SidebarFooter className="p-4 border-t">
                {/* Si quieres botón global, lo conectas cuando StatisticsForm te devuelva folders */}
                {/* <Button onClick={() => handleRunAnalysis(...)} disabled={isRunning} className="w-full">
          {isRunning ? 'Running Analysis...' : 'Run Analysis'}
        </Button> */}
            </SidebarFooter>
        </>
    );
}
