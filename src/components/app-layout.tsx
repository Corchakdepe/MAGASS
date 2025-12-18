'use client';
import {usePathname} from 'next/navigation';
import {SidebarProvider, Sidebar, SidebarInset} from '@/components/ui/sidebar';
import SidebarContentComponent from '@/components/sidebar-content';
import SidebarHistory from '@/components/sidebar-history';
import MainContent from '@/components/main-content';
import type {SimulationData} from '@/types/simulation';
import type {MainContentMode} from '@/types/view-mode';
import {BottomPanel} from '@/components/BottomPanel';
import {useCallback, useMemo, useState} from 'react';

import SidebarContentUploadMaps from '@/components/sidebar-content-upload-maps';
import GraphAnalysisSidebar from '@/components/graph-analysis-sidebar';

type AppLayoutProps = { children?: React.ReactNode };


export type StationPickPayload = { mapName?: string; station: number; data?: number | null };

function getModeFromPath(pathname: string): MainContentMode {
    if (pathname.startsWith('/simulador')) return 'simulations';
    if (pathname.startsWith('/analyticsGraphCreator')) return 'analyticsGraphs';
    if (pathname.startsWith('/analyticsMapCreator')) return 'analyticsMaps';
    if (pathname.startsWith('/filters')) return 'filters';
    if (pathname.startsWith('/history')) return 'dashboard';
    return 'dashboard';
}

export default function AppLayout({children}: AppLayoutProps) {
    const pathname = usePathname();
    const mode = getModeFromPath(pathname);

    const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [simulationName, setSimulationName] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Only used when bottom panel is present
    const [bottomOffset, setBottomOffset] = useState(0);

    const handleSimulationComplete = (data: SimulationData) => {
        setSimulationData(data);
        setSimulationName(data.simName);
        setCurrentRunId(data.folder);
        setRefreshTrigger((prev) => prev + 1);
    };

    const panelMode = useMemo<'none' | 'maps' | 'graphs'>(() => {
        if (pathname.startsWith('/analyticsMapCreator')) return 'maps';
        if (pathname.startsWith('/analyticsGraphCreator')) return 'graphs';
        return 'none';
    }, [pathname]);

    const showBottomPanel = panelMode !== 'none';
    const showRightSidebar = mode === 'simulations' || mode === 'dashboard';

    type StationsTargetKey = 'mapa_densidad' | 'mapa_voronoi' | 'mapa_circulo';

    const [pickedStations, setPickedStations] = useState<Record<string, string>>({});
    const [activeStationsTargetKey, setActiveStationsTargetKey] =
        useState<StationsTargetKey>('mapa_circulo');

    function parseStationsLoose(input: string): number[] {
        return Array.from(new Set((input ?? '').trim().split(/[^0-9]+/g).filter(Boolean).map(Number)))
            .filter(n => Number.isFinite(n) && Number.isInteger(n) && n >= 0)
            .sort((a, b) => a - b);
    }

    function formatStationsCanonical(nums: number[]) {
        return nums.join(';');
    }

    const toggleStation = useCallback((mapKey: string, station: number) => {
        setPickedStations(prev => {
            const current = parseStationsLoose(prev[mapKey] ?? '');
            const next = current.includes(station)
                ? current.filter(x => x !== station)
                : [...current, station].sort((a, b) => a - b);
            return {...prev, [mapKey]: formatStationsCanonical(next)};
        });
    }, []);

    const onStationPick = useCallback((p: { mapName?: string; station: number; data?: number | null }) => {
        toggleStation(activeStationsTargetKey, p.station);
    }, [activeStationsTargetKey, toggleStation]);


    return (
        <div className="flex min-h-screen w-full">
            <SidebarProvider defaultOpen>
                <Sidebar side="left">
                    <SidebarContentComponent
                        simulationName={simulationName ?? null}
                        currentFolder={currentRunId ?? null}
                    />
                </Sidebar>

                <SidebarInset>
                    {/* Reserve space only when bottom panel is visible */}
                    <div className="flex h-full w-full" style={{paddingBottom: showBottomPanel ? bottomOffset : 0}}>
                        <div className="flex-1 flex flex-col">
                            <MainContent
                                simulationData={simulationData}
                                triggerRefresh={refreshTrigger}
                                mode={mode}
                                onStationPick={onStationPick}
                                // optionally also activeStationsTargetKey if you need it there
                            />
                            {children}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            {/* Right sidebar only for simulations + history/dashboard */}
            {showRightSidebar && (
                <SidebarProvider defaultOpen className="w-fit">
                    <Sidebar side="right">
                        <SidebarHistory
                            onSimulationComplete={handleSimulationComplete}
                            currentRunId={currentRunId}
                            onRunIdChange={setCurrentRunId}
                        />
                    </Sidebar>
                </SidebarProvider>
            )}


            {/* New behavior only for maps/graphs */}
            {showBottomPanel && (
                <BottomPanel
                    defaultOpen
                    leftOffsetPx={256}     // 16rem sidebar
                    maxHeight={192}        // <-- change this number to test sizes (e.g. 280/360/480/640)
                    onHeightChange={(h) => setBottomOffset(h)}
                >

                    <div className="p-4">
                        {panelMode === 'maps' && (
                            <SidebarContentUploadMaps
                                runId={currentRunId ?? undefined}
                                onSimulationComplete={handleSimulationComplete}
                                externalStationsMaps={pickedStations}
                                activeStationsTargetKey={activeStationsTargetKey}
                                onActiveStationsTargetKeyChange={setActiveStationsTargetKey}
                            />

                            )}

                        {panelMode === 'graphs' && (
                            <GraphAnalysisSidebar runId={currentRunId ?? undefined}/>
                        )}
                    </div>
                </BottomPanel>
            )}
        </div>
    );
}
