"use client";

import {useEffect, useState} from "react";
import {SidebarProvider} from "@/components/ui/sidebar";
import {useLayoutMode} from "@/components/layout/hooks/useLayoutMode";
import {useSimulationState} from "@/components/layout/hooks/useSimulationState";
import {useStationPicker} from "@/components/layout/hooks/useStationPicker";
import LeftSidebar from "@/components/layout/components/LeftSidebar";
import RightSidebar from "@/components/layout/components/RightSidebar";
import MainContentArea from "@/components/layout/components/MainContentArea";
import type {AppLayoutProps} from "@/components/layout/types/layout";

export default function AppLayout({children}: AppLayoutProps) {
    // Get mode and setters from the hook
    const {mode, panelMode, showBottomPanel, showRightSidebar} = useLayoutMode();



    const {
        simulationData,
        currentRunId,
        simulationName,
        refreshTrigger,
        setCurrentRunId,
        handleSimulationComplete,
    } = useSimulationState();

    const {
        externalStationsMaps,
        onStationPick,
        onClearSharedStations,
    } = useStationPicker();


    const [bottomOffset, setBottomOffset] = useState(0);

    // Determine if sidebars should be hidden based on mode
    const hideLeftSidebar = mode === 'dirComparison' || mode === 'statisticsAnalyzer';
    const hideRightSidebar = mode === 'dirComparison' || mode === 'statisticsAnalyzer';

    return (
        <div className="flex min-h-screen w-full bg-surface-0 text-text-primary overflow-hidden">
            <SidebarProvider defaultOpen>
                <div className="flex min-h-screen w-full flex-1 overflow-hidden">
                    {/* LeftSidebar - conditionally rendered */}

                        <LeftSidebar
                            simulationName={simulationName}
                            currentRunId={currentRunId}
                        />

                    <MainContentArea
                        simulationData={simulationData}
                        refreshTrigger={refreshTrigger}
                        mode={mode}
                        onStationPick={onStationPick}
                        bottomOffset={0} // No longer needed for sidebar style
                        showBottomPanel={showBottomPanel}
                    />
                </div>
            </SidebarProvider>

            {/* Right sidebar - conditionally rendered based on mode AND existing conditions */}
            {!hideRightSidebar && (showRightSidebar || showBottomPanel) && (
                <RightSidebar
                    currentRunId={currentRunId}
                    onRunIdChange={setCurrentRunId}
                    onSimulationComplete={handleSimulationComplete}
                    // Bottom panel specific props
                    panelMode={panelMode}
                    externalStationsMaps={externalStationsMaps}
                    onHeightChange={setBottomOffset}
                    onClearExternalStationsMaps={onClearSharedStations}
                    // Which content to show
                    showBottomPanel={showBottomPanel}
                    showRunHistory={showRightSidebar}
                />
            )}
        </div>
    );
}