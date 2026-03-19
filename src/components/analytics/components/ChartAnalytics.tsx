"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StandardizedChart, LegacyChart } from "@/components/visualizationsGraphs/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChartAnalysis } from "../hooks/useChartAnalytics";

import { OverviewTab } from "./tabs/OverviewTab";
import { ComparisonTab } from "./tabs/ComparisonTab";
import { VolatilityTab } from "./tabs/VolatilityTab";
import { AnomaliesTab } from "./tabs/AnomaliesTab";
import { PerformanceTab } from "./tabs/PerformanceTab";

// NEW tabs (create these files below)
import { TrendTab } from "./tabs/TrendTab";
import { ShapeActivityTab } from "./tabs/ShapeActivityTab";

interface ChartAnalyticsProps {
  chart: StandardizedChart | LegacyChart;
}

export function ChartAnalytics({ chart }: ChartAnalyticsProps) {
  const { t } = useLanguage();

  const {
    seriesData,
    statistics,
    rankings,
    comparisons,
    volatility,
    volatilityChartData,
    anomalies,
    performanceMetrics,
    trends,
    shapes,
    activity,
    rolling,
    lagComparisons,
    hasData,
  } = useChartAnalysis(chart);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-secondary font-body">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-surface-2 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            {t("overview")}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            {t("comparison")}
          </TabsTrigger>
          <TabsTrigger value="volatility" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            {t("volatility")}
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            {t("anomalies")}
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            {t("performance")}
          </TabsTrigger>

          <TabsTrigger value="trend" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            Trend
          </TabsTrigger>
          <TabsTrigger value="shape" className="text-xs font-medium text-text-secondary data-[state=active]:bg-surface-1 data-[state=active]:text-accent data-[state=active]:shadow-mac-panel rounded-md transition-all">
            Shape
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <OverviewTab statistics={statistics} rankings={rankings} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4 mt-4">
          <ComparisonTab comparisons={comparisons} seriesData={seriesData} />
          {/* optional: show lag comparisons here too, but we’ll put it in TrendTab for now */}
        </TabsContent>

        <TabsContent value="volatility" className="space-y-4 mt-4">
          <VolatilityTab volatility={volatility} volatilityChartData={volatilityChartData} />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4 mt-4">
          <AnomaliesTab anomalies={anomalies} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-4">
          <PerformanceTab seriesData={seriesData} performanceMetrics={performanceMetrics} />
        </TabsContent>

        <TabsContent value="trend" className="space-y-4 mt-4">
          <TrendTab trends={trends} rolling={rolling} lagComparisons={lagComparisons} />
        </TabsContent>

        <TabsContent value="shape" className="space-y-4 mt-4">
          <ShapeActivityTab shapes={shapes} activity={activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
