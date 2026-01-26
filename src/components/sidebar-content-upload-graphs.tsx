// components/sidebar-content-upload-maps.tsx
'use client';

import {useState} from 'react';
import {useToast} from '@/hooks/use-toast';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import {useLanguage} from '@/contexts/LanguageContext';
import type {SimulationData} from '@/types/simulation';
import StatisticsForm from '@/components/statistics-form';
import {API_BASE} from "@/lib/analysis/constants";

type SidebarContentProps = {
    onSimulationComplete: (data: SimulationData) => void;
    runId?: string;
};


export default function SidebarContentUploadMaps({
                                                     onSimulationComplete,
                                                     runId
                                                 }: SidebarContentProps) {
    const {t} = useLanguage();
    const {toast} = useToast();
    const [isRunning, setIsRunning] = useState(false);

    const handleRunAnalysis = async () => {


        setIsRunning(true);

        try {
            const body = {
                run: runId || undefined,  // NEW
                seleccionagregacion: -1,
            };

            const response = await fetch(`${API_BASE}/exe/simular-json`, {

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
                title: t('analysisComplete'),
                description: t('analysisFinishedSuccessfully'),
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: t('error'),
                description:
                    error instanceof Error ? error.message : t('analysisFailed'),
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
                        {t('analysis')}
                    </h2>
                    <p className="text-[11px] text-text-secondary">
                        {t('mapCreationParameters')}
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
                    {runId ? `${t('run')}: ${runId}` : t('noRunSelected')}
                </div>
            </SidebarFooter>
        </>
    );

}
