"use client";

import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import {Skeleton} from "@/components/ui/skeleton";
import {useSummaryMetrics} from "./hooks/useSummaryMetrics";
import {useSimulationInfo} from "./hooks/useSimulationInfo"
import type {SummaryPanelProps} from "./types/summary";
import {KeyInsightsSection} from "./components/KeyInsightsSection";
import {MetricsOverviewSection} from "./components/MetricsOverviewSection";
import {OperationsPieChart} from "./components/OperationsPieChart";
import {SuccessRateBarChart} from "./components/SuccessRateBarChart";
import {DistanceBarChart} from "./components/DistanceBarChart";
import {EfficiencyGaugeCard} from "./components/EfficiencyGaugeCard";
import {PerformanceRadarChart} from "./components/PerformanceRadarChart";
import {OperationsComparisonRadar} from "./components/OperationsComparisonRadar";
import {API_BASE} from "@/lib/analysis/constants";
import {SimulationInfoPanel} from "./components/InfoCard";
import {AlertTriangle} from "lucide-react";


export function SummaryPanel({summary, runId, loading = false}: SummaryPanelProps) {
    const {t} = useLanguage();
    const metrics = useSummaryMetrics(summary);

    // Fetch simulation info from the new API endpoint
    const {data: simulationInfo, loading: infoLoading, error: infoError} = useSimulationInfo(runId);

    // Construct the iframe URL for the capacity map
    const iframeUrl = React.useMemo(() => {
        if (!runId) return null;
        return `${API_BASE}/results/file/${runId}/MapaCapacidades.html`;
    }, [runId]);

    if (loading || infoLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48"/>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32"/>
                    ))}
                </div>
            </div>
        );
    }

    if (!runId) {
        return (
            <div className="h-full w-full flex items-center justify-center text-text-secondary">
                No simulation selected
            </div>
        );
    }

    if (!summary || !metrics) {
        return null;
    }

    // Use data from the new API endpoint or fallbacks
    const cityName = simulationInfo?.city || "Unknown City";
    const stationCount = simulationInfo?.stations || 0;
    const totalCapacity = simulationInfo?.total_capacity || 0;
    const bikeCount = simulationInfo?.active_bikes || 0;

    return (
        <div className="space-y-6 flex-1 overflow-auto p-6 h-full w-full">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("simulationSummary") || "Simulation Summary"}
                </h1>
                <p className="text-base text-text-secondary">
                    {t("detailedMetricsFromSimulation") || "Detailed metrics and insights from your simulation"}
                </p>
            </div>

            <SimulationInfoPanel
                cityName={cityName}
                stationCount={stationCount}
                totalCapacity={totalCapacity}
                bikeCount={bikeCount}
                className="mb-6"
            />


            {/* Map Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-text-primary">
                        {t("initialCapacityMap") || "Initial Capacity Map"}
                    </h2>
                    {simulationInfo && (
                        <div className="text-sm text-text-tertiary">
                            Showing {simulationInfo.stations} stations in {simulationInfo.city}
                        </div>
                    )}
                </div>

                <div
                    className="h-[500px] w-full rounded-lg border border-surface-3 bg-surface-0/60 shadow-mac-panel overflow-hidden">
                    {iframeUrl ? (
                        <iframe
                            src={iframeUrl}
                            className="h-full w-full"
                            loading="lazy"
                            title="Initial Capacity Map"
                            onError={(e) => {
                                console.error("Failed to load iframe:", e);
                            }}
                        />
                    ) : (
                        <div
                            className="h-full w-full flex flex-col items-center justify-center text-text-secondary bg-surface-1">
                            <div className="text-lg font-medium mb-2">Map Not Available</div>
                            <div className="text-sm text-text-tertiary">
                                Capacity map not generated for this simulation
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Insights */}
            <KeyInsightsSection metrics={metrics} t={t}/>

            {/* Metrics Overview */}
            <MetricsOverviewSection summary={summary} metrics={metrics} t={t}/>

            {/* Charts Grid - First Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OperationsPieChart metrics={metrics} t={t}/>
                <EfficiencyGaugeCard metrics={metrics} t={t}/>
            </div>

            {/* Radar Charts */}
            <div className="space-y-6">
                <PerformanceRadarChart metrics={metrics} t={t}/>
                <OperationsComparisonRadar metrics={metrics} t={t}/>
            </div>

            {/* Success Rate Chart */}
            <SuccessRateBarChart metrics={metrics} t={t}/>

            {/* Distance Distribution */}
            <DistanceBarChart metrics={metrics} t={t}/>
        </div>
    );
}