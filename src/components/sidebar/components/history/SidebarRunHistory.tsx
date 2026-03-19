// SidebarRunHistory.tsx

'use client';

import {usePathname} from 'next/navigation';
import {SidebarHeader, SidebarContent as SidebarBody} from '@/components/ui/sidebar';
import {useLanguage} from '@/contexts/LanguageContext';
import LanguageSelector from "@/components/controls/CommunControls/LanguageSelector";
import SimulationPanel from '../simulation/SimulationPanel';
import {SimulationHistoryItem} from './SimulationHistoryItem';
import {DeleteConfirmModal} from './DeleteConfirmModal';
import {useSidebarHistory} from '../../hooks/useSidebarHistory';
import {useSimulationDelete} from '../../hooks/useSimulationDelete';
import type {SidebarRunHistoryProps} from '../../types/sidebar';
import {SimulationParametersBox} from './SimulationParametersBox';
import {useSelectedSimulationParameters} from '../../hooks/useSimulationParameters';

export default function SidebarRunHistory({
                                              onSimulationComplete,
                                              currentRunId,
                                              onRunIdChange,
                                          }: SidebarRunHistoryProps) {
    const {t} = useLanguage();
    const pathname = usePathname();

    // Custom hooks
    const {history, loadingHistory, loadHistory, handleSelectRun, selectedItem} = useSidebarHistory(
        onSimulationComplete,
        onRunIdChange
    );

    const {
        deleteState,
        handleDeleteClick,
        handleConfirmDelete,
        handleCancelDelete
    } = useSimulationDelete(onRunIdChange, loadHistory);

    // Get parameters for the selected simulation
    const {parameters, loading: parametersLoading, error: parametersError} =
        useSelectedSimulationParameters(currentRunId);

    // Render simulation panel for /simulador route
    if (pathname === '/simulador') {
        return <SimulationPanel onSimulationComplete={onSimulationComplete!}
                                currentRunId={currentRunId}
                                onRunIdChange={onRunIdChange}/>;
    }

    // Render history sidebar for other routes
    return (
        <>
            <SidebarHeader className="border-b border-surface-3/50 px-4 py-3 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold">{t('simulationHistory')}</h3>
                    <p className="text-xs text-text-secondary">{t('selectRunToLoadSummary')}</p>
                </div>
                <LanguageSelector/>
            </SidebarHeader>

            <SidebarBody className="px-4 py-4 flex flex-col h-full">
                {/* History List - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loadingHistory && (
                        <p className="text-sm text-text-secondary">{t('loadingHistory')}</p>
                    )}

                    {!loadingHistory && history.length === 0 && (
                        <p className="text-sm text-text-secondary">{t('noSimulationsYet')}</p>
                    )}

                    {!loadingHistory && history.length > 0 && (
                        <div className="space-y-2">
                            {history.map((item) => (
                                <SimulationHistoryItem
                                    key={item.simfolder}
                                    item={item}
                                    isSelected={currentRunId === item.simfolder}
                                    isDeleting={deleteState.id === item.simfolder}
                                    onSelect={handleSelectRun}
                                    onDeleteClick={handleDeleteClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Parameters Box - Fixed at bottom */}
                <div className="mt-4 pt-2 border-t border-surface-3">
                    <SimulationParametersBox
                        parameters={parameters}
                        loading={parametersLoading}
                        error={parametersError}
                        simulationName={selectedItem?.name || selectedItem?.simname || currentRunId}
                    />
                </div>
            </SidebarBody>

            <DeleteConfirmModal
                show={deleteState.showConfirm !== null}
                deletingId={deleteState.id}
                onConfirm={() => deleteState.showConfirm && handleConfirmDelete(deleteState.showConfirm)}
                onCancel={handleCancelDelete}
            />
        </>
    );
}