"use client";

import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import {Skeleton} from "@/components/ui/skeleton";
import {useSummaryMetrics} from "./hooks/useSummaryMetrics";
import type {SummaryPanelProps} from "./types/summary";
import {KeyInsightsSection} from "./components/KeyInsightsSection";
import {MetricsOverviewSection} from "./components/MetricsOverviewSection";
import {OperationsPieChart} from "./components/OperationsPieChart";
import {SuccessRateBarChart} from "./components/SuccessRateBarChart";
import {DistanceBarChart} from "./components/DistanceBarChart";
import {EfficiencyGaugeCard} from "./components/EfficiencyGaugeCard";
import {PerformanceRadarChart} from "./components/PerformanceRadarChart";
import {OperationsComparisonRadar} from "./components/OperationsComparisonRadar";
import {API_BASE} from "@/lib/analysis/constants"
import {useMapsAnalysis} from "@/components/sidebar/hooks/useMapsAnalysis";
import {useMapsAnalysisState} from "@/components/sidebar/hooks/useMapsAnalysisState";










export function SummaryPanel({summary, runId, loading = false}: SummaryPanelProps) {{
    const {t} = useLanguage();
    const metrics = useSummaryMetrics(summary);




    // Construct the iframe URL
    const iframeUrl = React.useMemo(() => {
        console.log('runId in iframeUrl memo:', runId);
        console.log('API_BASE:', API_BASE);
        if (!runId) {
            console.log('No runId provided');
            return null;
        }

        // Ensure proper URL construction
        const url = `${API_BASE}/results/file/${runId}/MapaInicial.html`;
        console.log('Constructed iframe URL:', url);
        return url;
    }, [runId]);



    if (loading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-8 w-48"/>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="h-24"/>
                    ))}
                </div>
            </div>
        );
    }

    if (!summary || !metrics) {
        return null;
    }

    return (
        <div className="space-y-3 flex-4 overflow-auto p-4 h-full w-full">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-text-primary mb-1">
                    {t("simulationSummary") || "Simulation Summary"}

                </h1>
                <h2 className="text-xl font-bold text-text-primary mb-1">

                    {t("initialCapacityMap") || "Initial capacity map"}
                </h2>
                <p className="text-sm text-text-secondary">
                    {t("detailedMetricsFromSimulation") || "Detailed metrics and insights from your simulation"}
                </p>
            </div>


            <div
                className="h-96 w-full rounded-md border border-surface-3 bg-surface-0/60">
                {/* Iframe */}
                {iframeUrl ? (
                    <iframe
                        src={iframeUrl}
                        className="h-full w-full"
                        loading="lazy"
                        title="Initial Capacity Map"
                        // Optional: add error handling
                        onError={(e) => {
                            console.error("Failed to load iframe:", e);
                        }}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-text-secondary">
                        No run ID provided or unable to load map
                    </div>
                )}
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
            <div className="space-y-2">
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