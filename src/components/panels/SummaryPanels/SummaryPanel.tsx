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
import {SummaryCard} from "./components/SummaryCard";
import {MapViewer} from "@/components/vizualizationsMaps/components/MapViewer"; // Make sure this is imported

export function SummaryPanel({summary, loading = false, runId}: SummaryPanelProps) {
    const {t} = useLanguage();
    const metrics = useSummaryMetrics(summary);

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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-text-primary mb-1">
                    {t("simulationSummary") || "Simulation Summary"}
                </h2>
                <p className="text-sm text-text-secondary">
                    {t("detailedMetricsFromSimulation") || "Detailed metrics and insights from your simulation"}
                </p>
            </div>




    {/* Key Insights */
    }
    <KeyInsightsSection metrics={metrics} t={t}/>

    {/* Metrics Overview */
    }
    <MetricsOverviewSection summary={summary} metrics={metrics} t={t}/>

    {/* Charts Grid - First Row */
    }
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationsPieChart metrics={metrics} t={t}/>
        <EfficiencyGaugeCard metrics={metrics} t={t}/>
    </div>

    {/* Radar Charts */
    }
    <div className="space-y-2">
        <PerformanceRadarChart metrics={metrics} t={t}/>
        <OperationsComparisonRadar metrics={metrics} t={t}/>
    </div>

    {/* Success Rate Chart */
    }
    <SuccessRateBarChart metrics={metrics} t={t}/>

    {/* Distance Distribution */
    }
    <DistanceBarChart metrics={metrics} t={t}/>
</div>
)
    ;
}