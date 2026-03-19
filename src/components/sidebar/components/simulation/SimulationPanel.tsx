'use client';

import React from "react";
import {SidebarHeader, SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import SimulationForm from '@/components/controls/SimulationControls/simulation-form';
import {useLanguage} from '@/contexts/LanguageContext';
import {useSimulationForm} from '../../hooks/useSimulationForm';
//import type {SimulationPanelProps} from '../../types/sidebar';


type SimulationPanelProps = {
    onSimulationComplete: () => void;
    currentRunId?: string | null;
    onRunIdChange?: (runId: string) => void;
};

export default function SimulationPanel({
                                            onSimulationComplete,
                                            currentRunId,
                                            onRunIdChange
                                        }: SimulationPanelProps) {
    const {t} = useLanguage();
    const formState = useSimulationForm(onSimulationComplete);

    // Map your existing hook props to what SimulationForm expects
    const formProps = {
        stress: formState.stress,
        setStress: formState.setStress,
        walkCost: formState.walkCost,
        setWalkCost: formState.setWalkCost,
        delta: formState.delta,
        setDelta: formState.setDelta,
        stressType: formState.stressType,
        setStressType: formState.setStressType,
        simName: formState.simName,
        setSimName: formState.setSimName,
        folderPath: formState.folderPath,
        setFolderPath: formState.setFolderPath,
        onFileUpload: formState.handleFileUpload,
        uploadedFiles: formState.uploadedFiles,
        onRunSimulation: formState.onRunSimulation,
        isLoading: formState.isLoading,
    };

    return (
        <>
            <SidebarHeader className="border-b border-surface-3/50 px-4 py-3">
                <h3 className="text-base font-semibold">{t('runSimulation')}</h3>
            </SidebarHeader>
            <SidebarBody className="px-4 py-4">
                <SimulationForm {...formProps}
                                currentRunId={currentRunId}
                                onRunIdChange={onRunIdChange}/>
            </SidebarBody>
        </>
    );
}