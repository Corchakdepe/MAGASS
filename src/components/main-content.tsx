// components/main-content.tsx
'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {RefreshCw} from 'lucide-react';
import type {SimulationData, SimulationSummaryData} from '@/types/simulation';
import type {MainContentMode} from '@/types/view-mode';
import SummaryPanel from '@/components/summary-panel';
import VisualizationsPanel from '@/components/visualizations-panel';
import type {GraphItem} from '@/components/visualizations-panel';
import {FiltersPanel} from '@/components/visualizationsFilters';
import DashboardPanel from '@/components/dashboard-panel';
import MapAnalysisCreator from '@/components/map-analysis-creator';


export type RawResultItem = {
    id: string;
    name: string;
    kind: 'graph' | 'map' | 'matrix';
    format: 'csv' | 'json' | 'html' | 'png';
    url: string;
    api_full_url?: string;
    created?: string;
    meta?: Record<string, unknown>;
};

type MainContentProps = {
    simulationData: SimulationData | null;
    triggerRefresh?: number;
    mode: MainContentMode;
    onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

const defaultSummary: SimulationSummaryData = {
    deltaMinutes: 0,
    stressPercentage: 0,
    realPickupKms: 0,
    realDropoffKms: 0,
    fictionalPickupKms: 0,
    fictionalDropoffKms: 0,
    resolvedRealPickups: 0,
    resolvedRealDropoffs: 0,
    unresolvedRealPickups: 0,
    unresolvedRealDropoffs: 0,
    resolvedFictionalPickups: 0,
    resolvedFictionalDropoffs: 0,
    unresolvedFictionalPickups: 0,
    unresolvedFictionalDropoffs: 0,
};

const parseSimulationData = (dataString: string): SimulationSummaryData => {
    const cleaned = dataString.trim().replace(/^"|"$/g, '');
    const values = cleaned.split(',').map(v => Number(v.trim()) || 0);
    return {
        deltaMinutes: values[0] || 0,
        stressPercentage: values[1] || 0,
        realPickupKms: values[2] || 0,
        realDropoffKms: values[3] || 0,
        fictionalPickupKms: values[4] || 0,
        fictionalDropoffKms: values[5] || 0,
        resolvedRealPickups: values[6] || 0,
        resolvedRealDropoffs: values[7] || 0,
        unresolvedRealPickups: values[8] || 0,
        unresolvedRealDropoffs: values[9] || 0,
        resolvedFictionalPickups: values[10] || 0,
        resolvedFictionalDropoffs: values[11] || 0,
        unresolvedFictionalPickups: values[12] || 0,
        unresolvedFictionalDropoffs: values[13] || 0,
    };
};

export default function MainContent({
                                        simulationData: externalSimData,
                                        triggerRefresh,
                                        mode,
                                        onStationPick,
                                    }: MainContentProps) {

    const [simulationData, setSimulationData] =
        useState<SimulationData | null>(externalSimData);
    const [simulationSummary, setSimulationSummary] =
        useState<SimulationSummaryData>(defaultSummary);
    const [latestFolder, setLatestFolder] = useState<string | null>(null);
    const [maps, setMaps] = useState<RawResultItem[]>([]);
    const [chartsFromApi, setChartsFromApi] = useState<any[]>([]);
    const [graphs, setGraphs] = useState<GraphItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // aplica selección desde fuera (history / simulador)
    useEffect(() => {
        if (externalSimData) {
            setSimulationData(externalSimData);
            if (externalSimData.simulationSummary) {
                setSimulationSummary(externalSimData.simulationSummary);
            }
        }
    }, [externalSimData]);

    const fetchLatest = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const listResponse = await fetch(`${API_BASE}/list-simulations`, {
                cache: 'no-store',
            });
            if (!listResponse.ok) throw new Error('Failed to fetch simulations');
            const listData = await listResponse.json();

            if (Array.isArray(listData.simulations) && listData.simulations.length > 0) {
                const latest = listData.simulations[0];
                const latestFolderName = latest.simfolder ?? latest.name;
                setLatestFolder(latestFolderName);

                // solo auto-carga resumen si no hay selección externa
                if (!externalSimData) {
                    let summary = defaultSummary;
                    const summaryResponse = await fetch(`${API_BASE}/simulation-summary`, {
                        cache: 'no-store',
                    });
                    if (summaryResponse.ok) {
                        summary = parseSimulationData(await summaryResponse.text());
                    }
                    setSimulationSummary(summary);

                    const sim: SimulationData = {
                        folder: latestFolderName,
                        created: latest.created,
                        fileCount: latest.file_count,
                        simulationSummary: summary,
                        chartData: [],
                        mapUrl: '',
                        heatmapUrl: '',
                        csvData: '',
                        simName: '',
                    };
                    setSimulationData(sim);
                }

                const runForFetch =
                    externalSimData?.folder ?? latestFolderName;

                if (mode === 'analyticsGraphs') {
                    const graphsRes = await fetch(
                        `${API_BASE}/results/list?run=${encodeURIComponent(
                            runForFetch,
                        )}&kind=graph`,
                        {cache: 'no-store'},
                    );
                    if (graphsRes.ok) {
                        const {items} = await graphsRes.json();
                        const graphItems = (items as RawResultItem[])
                            .filter(
                                x =>
                                    x.kind === 'graph' &&
                                    (x.format === 'csv' || x.format === 'json'),
                            )
                            .map(x => x as GraphItem);
                        setGraphs(graphItems);
                    } else {
                        setGraphs([]);
                    }
                } else {
                    setGraphs([]);
                }

                if (mode === 'analyticsMaps' || mode === 'maps') {
                    const mapsRes = await fetch(
                        `${API_BASE}/results/list?run=${encodeURIComponent(
                            runForFetch,
                        )}&kind=map`,
                        {cache: 'no-store'},
                    );
                    if (mapsRes.ok) {
                        const {items} = await mapsRes.json();
                        const mapItems = (items as RawResultItem[]).filter(
                            x => x.kind === 'map' && (x.format === 'html' || x.format === 'png'),
                        );
                        setMaps(mapItems);
                    } else {
                        setMaps([]);
                    }
                } else {
                    setMaps([]);
                }

                setChartsFromApi([]);
            } else {
                setSimulationData(null);
                setLatestFolder(null);
                setSimulationSummary(defaultSummary);
                setGraphs([]);
                setMaps([]);
                setChartsFromApi([]);
            }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load simulation data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLatest();
        const interval = setInterval(fetchLatest, 30000);
        return () => clearInterval(interval);
    }, [triggerRefresh, mode]);

    if (isLoading && !simulationData) {
        return (
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between p-4 border-b bg-card">
                    <h1 className="text-2xl font-bold font-headline">
                        Gonzalo Bike Dashboard
                    </h1>
                </header>
                <main className="flex-1 grid place-items-center">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2"/>
                        <p className="text-muted-foreground">Loading…</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !simulationData) {
        return (
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between p-4 border-b bg-card">
                    <h1 className="text-2xl font-bold font-headline">
                        Gonzalo Bike Dashboard
                    </h1>
                    <Button variant="secondary" onClick={fetchLatest}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Retry
                    </Button>
                </header>
                <main className="flex-1 grid place-items-center">
                    <div className="text-center text-red-600">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    const currentFolder = simulationData?.folder ?? latestFolder ?? '';

    if (!simulationData && !currentFolder) {
        return (
            <div className="flex flex-col h-full">
                <header className="flex items-center justify-between p-4 border-b bg-card">
                    <h1 className="text-2xl font-bold font-headline">
                        Gonzalo Bike Dashboard
                    </h1>
                </header>
                <main className="flex-1 grid place-items-center text-muted-foreground">
                    <div className="text-center">
                        <p className="text-lg font-medium mb-2">No simulation results yet</p>
                        <p className="text-sm">Run a simulation to see results here</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">


            <main className="flex-1 p-6 space-y-6 overflow-y-auto">

                {mode === 'simulations' && (
                    <SummaryPanel kind="simulation" summaryData={simulationSummary}/>
                )}

                {mode === 'analyticsGraphs' && (
                    <VisualizationsPanel
                        mode={mode}
                        apiBase={API_BASE}
                        runId={currentFolder}
                        simulationData={simulationData ?? null}
                        graphs={graphs}
                        maps={maps}
                        chartsFromApi={chartsFromApi}
                    />
                )}

                {mode === 'analyticsMaps' && (
                    <MapAnalysisCreator
                        runId={currentFolder}
                        apiBase={API_BASE}
                        maps={maps}
                        onStationPick={onStationPick}
                    />
                )}


                {mode === 'maps' && (
                    <VisualizationsPanel
                        mode={mode}
                        apiBase={API_BASE}
                        runId={currentFolder}
                        simulationData={simulationData ?? null}
                        graphs={graphs}
                        maps={maps}
                        chartsFromApi={chartsFromApi}
                    />
                )}

                {mode === 'filters' && currentFolder && (
                    <FiltersPanel apiBase={API_BASE} runId={currentFolder}/>
                )}

                {mode === 'dashboard' && currentFolder && (
                    <DashboardPanel apiBase={API_BASE} runId={currentFolder}/>
                )}


            </main>
        </div>
    );
}
