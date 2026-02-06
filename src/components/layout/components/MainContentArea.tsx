"use client";

import {useEffect, useState} from "react";
import {RefreshCw, AlertCircle} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";
import {
    useSimulationData,
    useCurrentRunId,
    useSimulationRuns,
} from "@/hooks/useSimulationHooks";
import type {MainContentMode} from "@/types/view-mode";
import type {AnalysisArtifact} from "@/types/core-data";
import type {GraphItem, MapItem} from "@/components/types/artifacts";
import {SummaryPanel} from "@/components/panels/SummaryPanels";
import {VisualizationsPanel} from "@/components/panels/VisualizationsPanel";
import {FiltersPanel} from "@/components/panels/FiltersPanel";
import {DashboardPanel} from "@/components/panels/DashboardPanel";
import {API_BASE} from "@/lib/analysis/constants";

export type {RawResultItem, GraphItem, MapItem} from "@/components/types/artifacts";

type StationPickPayload = {
    mapName?: string;
    station: number;
    data?: number | null;
};

type MainContentProps = {
    simulationData?: { folder?: string } | null;
    triggerRefresh?: number;
    refreshTrigger?: number;  // Add both naming conventions
    mode: MainContentMode;
    onStationPick?: (p: StationPickPayload) => void;
    bottomOffset?: number;
    showBottomPanel?: boolean;
};

export function MainContentArea({
                                    simulationData: externalSimData,
                                    triggerRefresh,
                                    refreshTrigger,
                                    mode,
                                    onStationPick,
                                    bottomOffset = 0,
                                    showBottomPanel = false,
                                }: MainContentProps) {
    const {t} = useLanguage();

    // Use either prop name for refresh trigger
    const actualRefreshTrigger = refreshTrigger ?? triggerRefresh;

    const currentRunId = useCurrentRunId();
    const effectiveRunId = externalSimData?.folder ?? currentRunId ?? undefined;
    const {
        data: simulationContext,
        loading: isLoading,
        error,
        reload,
    } = useSimulationData(effectiveRunId);
    const {reload: reloadRuns} = useSimulationRuns();

    const [maps, setMaps] = useState<MapItem[]>([]);
    const [graphs, setGraphs] = useState<GraphItem[]>([]);
    const [chartsFromApi, setChartsFromApi] = useState<any[]>([]);

    function artifactToRawItem(artifact: AnalysisArtifact): GraphItem {
        return {
            id: artifact.id,
            name: artifact.name,
            kind: artifact.kind as "graph" | "map" | "matrix",
            format: artifact.format as "csv" | "json" | "html" | "png",
            url: artifact.url
                ? `results/${effectiveRunId}/${artifact.name}`
                : `${API_BASE}results/${effectiveRunId}/${artifact.name}`,
            api_full_url: artifact.url
                ? `${API_BASE}${artifact.url}`
                : `${API_BASE}results/${effectiveRunId}/${artifact.name}`,
            created: artifact.created,
            meta: artifact.metadata,
        };
    }

    useEffect(() => {
        if (!simulationContext?.artifacts) {
            setMaps([]);
            setGraphs([]);
            setChartsFromApi([]);
            return;
        }

        if (mode === "analyticsMaps" || mode === "maps") {
            const mapArtifacts = Array.from(simulationContext.artifacts.maps.values())
                .map((artifact) => artifactToRawItem(artifact))
                .filter((x) => x.format === "html" || x.format === "png");
            setMaps(mapArtifacts);
        } else {
            setMaps([]);
        }

        if (mode === "analyticsGraphs") {
            const graphArtifacts = Array.from(
                simulationContext.artifacts.graphs.values()
            )
                .map((artifact) => artifactToRawItem(artifact))
                .filter((x) => x.format === "csv" || x.format === "json");
            setGraphs(graphArtifacts);
        } else {
            setGraphs([]);
        }

        setChartsFromApi([]);
    }, [simulationContext, mode, effectiveRunId]);

    useEffect(() => {
        reload();
        reloadRuns();
    }, [actualRefreshTrigger, mode, reload, reloadRuns]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-text-tertiary"/>
                    <p className="mt-4 text-sm text-text-secondary">
                        {t("loadingSimulationResults")}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-red-500"/>
                    <p className="mt-4 text-sm text-text-primary">
                        {t("errorLoadingSimulation")}
                    </p>
                    <p className="text-xs text-text-secondary">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!effectiveRunId) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                    <p className="text-text-primary">{t("noSimulationSelected")}</p>
                    <p className="text-sm text-text-secondary">
                        {t("selectRunFromHistory")}
                    </p>
                </div>
            </div>
        );
    }

    if (!simulationContext) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="text-center">
                    <p className="text-text-primary">{t("noSimulationResults")}</p>
                    <p className="text-sm text-text-secondary">
                        {t("runSimulationToSeeResults")}
                    </p>
                </div>
            </div>
        );
    }

    const summaryData =
        simulationContext?.results?.summary &&
        typeof simulationContext.results.summary === "object"
            ? {
                deltaMinutes: simulationContext.results.summary.deltaMinutes ?? 0,
                stressPercentage:
                    simulationContext.results.summary.stressPercentage ?? 0,
                realPickupKms: simulationContext.results.summary.realPickupKms ?? 0,
                realDropoffKms: simulationContext.results.summary.realDropoffKms ?? 0,
                fictionalPickupKms:
                    simulationContext.results.summary.fictionalPickupKms ?? 0,
                fictionalDropoffKms:
                    simulationContext.results.summary.fictionalDropoffKms ?? 0,
                resolvedRealPickups:
                    simulationContext.results.summary.resolvedRealPickups ?? 0,
                resolvedRealDropoffs:
                    simulationContext.results.summary.resolvedRealDropoffs ?? 0,
                unresolvedRealPickups:
                    simulationContext.results.summary.unresolvedRealPickups ?? 0,
                unresolvedRealDropoffs:
                    simulationContext.results.summary.unresolvedRealDropoffs ?? 0,
                resolvedFictionalPickups:
                    simulationContext.results.summary.resolvedFictionalPickups ?? 0,
                resolvedFictionalDropoffs:
                    simulationContext.results.summary.resolvedFictionalDropoffs ?? 0,
                unresolvedFictionalPickups:
                    simulationContext.results.summary.unresolvedFictionalPickups ?? 0,
                unresolvedFictionalDropoffs:
                    simulationContext.results.summary.unresolvedFictionalDropoffs ?? 0,
            }
            : null;

    return (
        <div
            className="h-full w-full overflow-auto"
            style={{paddingBottom: showBottomPanel ? `${bottomOffset}px` : 0}}
        >
            {mode === "simulations" && (
                <>
                    {summaryData ? (
                        <SummaryPanel summary={summaryData} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <div className="text-center p-6">
                                <AlertCircle className="mx-auto h-8 w-8 text-yellow-500 mb-4"/>
                                <p className="text-text-primary mb-2">
                                    {t("noSummaryDataAvailable")}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    {t("summaryDataNotGeneratedYet")}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {(mode === "analyticsGraphs" ||
                mode === "analyticsMaps" ||
                mode === "maps") && (
                <VisualizationsPanel
                    mode={mode}
                    apiBase={API_BASE}
                    runId={effectiveRunId}
                    simulationData={simulationContext}
                    graphs={graphs}
                    maps={maps}
                    chartsFromApi={chartsFromApi}
                    onStationPick={onStationPick}
                />
            )}

            {mode === "filters" && <FiltersPanel runId={effectiveRunId}/>}

            {mode === "dashboard" && (
                <DashboardPanel
                    runId={effectiveRunId}
                    summaryData={summaryData}
                    simulationContext={simulationContext}
                />
            )}
        </div>
    );
}

export default MainContentArea;
