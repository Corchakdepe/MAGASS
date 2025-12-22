"use client";

import {useCallback, useMemo, useState} from "react";
import {usePathname} from "next/navigation";

import {SidebarProvider, Sidebar, SidebarInset} from "@/components/ui/sidebar";
import SidebarContentComponent from "@/components/sidebar-content";
import SidebarHistory from "@/components/sidebar-history";
import MainContent from "@/components/main-content";
import type {SimulationData} from "@/types/simulation";
import type {MainContentMode} from "@/types/view-mode";
import {BottomPanel} from "@/components/BottomPanel";

import SidebarContentUploadMaps from "@/components/sidebar-content-upload-maps";
import GraphAnalysisSidebar from "@/components/graph-analysis-sidebar";

type AppLayoutProps = { children?: React.ReactNode };

export type StationPickPayload = { mapName?: string; station: number; data?: number | null };

function getModeFromPath(pathname: string): MainContentMode {
    if (pathname.startsWith("/simulador")) return "simulations";
    if (pathname.startsWith("/analyticsGraphCreator")) return "analyticsGraphs";
    if (pathname.startsWith("/analyticsMapCreator")) return "analyticsMaps";
    if (pathname.startsWith("/filters")) return "filters";
    if (pathname.startsWith("/history")) return "dashboard";
    return "dashboard";
}

export default function AppLayout({children}: AppLayoutProps) {
    const pathname = usePathname();
    const mode = getModeFromPath(pathname);

    const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [simulationName, setSimulationName] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [bottomOffset, setBottomOffset] = useState(0);

    const handleSimulationComplete = (data: SimulationData) => {
        setSimulationData(data);
        setSimulationName(data.simName);
        setCurrentRunId(data.folder);
        setRefreshTrigger((prev) => prev + 1);
    };

    const panelMode = useMemo<"none" | "maps" | "graphs">(() => {
        if (pathname.startsWith("/analyticsMapCreator")) return "maps";
        if (pathname.startsWith("/analyticsGraphCreator")) return "graphs";
        return "none";
    }, [pathname]);

    const showBottomPanel = panelMode !== "none";
    const showRightSidebar = mode === "simulations" || mode === "dashboard";

    // ------------------------------------------------------------
    // Shared stations list (single station, overwrite on click)
    // ------------------------------------------------------------
    const [pickedStationsShared, setPickedStationsShared] = useState<string>("");

    const externalStationsMaps = useMemo(() => {
        return {
            mapa_circulo: pickedStationsShared,
            mapa_densidad: pickedStationsShared,
        } as Record<string, string>;
    }, [pickedStationsShared]);

    function parseStationsLoose(input: string): number[] {
        return Array.from(new Set((input ?? "").trim().split(/[^0-9]+/g).filter(Boolean).map(Number)))
            .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0);
    }

    function formatStationsCanonical(nums: number[]) {
        return nums.join(";");
    }

    const onStationPick = useCallback((p: StationPickPayload) => {
        setPickedStationsShared((prev) => {
            const cur = parseStationsLoose(prev);

            const idx = cur.indexOf(p.station);
            if (idx >= 0) {
                // toggle OFF (remove)
                cur.splice(idx, 1);
            } else {
                // toggle ON (add)
                cur.push(p.station);
            }

            cur.sort((a, b) => a - b);
            return formatStationsCanonical(cur);
        });
    }, []);


    // Allow sidebar to clear the shared state (so Limpiar truly clears)
    const onClearSharedStations = useCallback(() => {
        setPickedStationsShared("");
    }, []);

    return (
        <div className="flex min-h-screen w-full  ">
            <SidebarProvider defaultOpen>
                <Sidebar side="left">
                    <SidebarContentComponent simulationName={simulationName ?? null}
                                             currentFolder={currentRunId ?? null}/>
                </Sidebar>

                <SidebarInset>
                    <div className="flex h-full w-full" style={{paddingBottom: showBottomPanel ? bottomOffset : 0}}>
                        <div className="flex-1 flex flex-col">
                            <MainContent
                                simulationData={simulationData}
                                triggerRefresh={refreshTrigger}
                                mode={mode}
                                onStationPick={onStationPick}
                            />
                            {children}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

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

            {showBottomPanel && (
                <BottomPanel
                    defaultOpen
                    leftOffsetPx={256}
                    onHeightChange={(h) => setBottomOffset(h)}
                >
                    <div className="p-4">
                        {panelMode === "maps" && (
                            <SidebarContentUploadMaps
                                runId={currentRunId ?? undefined}
                                onSimulationComplete={handleSimulationComplete}
                                externalStationsMaps={externalStationsMaps}
                                onClearExternalStationsMaps={onClearSharedStations}
                            />
                        )}

                        {panelMode === "graphs" && <GraphAnalysisSidebar runId={currentRunId ?? undefined}/>}
                    </div>
                </BottomPanel>
            )}
        </div>
    );
}