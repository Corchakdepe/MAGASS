"use client";

import {RadarChart} from "@mui/x-charts/RadarChart";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type PerformanceRadarChartProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function PerformanceRadarChart({metrics, t}: PerformanceRadarChartProps) {
  // Prepare radar metrics - normalize all values to 0-100 scale for comparison
  const normalizeValue = (value: number, max: number) => {
    return max > 0 ? (value / max) * 100 : 0;
  };

  // Calculate performance dimensions
  const performanceData = [
    {
      metric: 'Success Rate',
      value: metrics.overallSuccessRate,
      max: 100,
    },
    {
      metric: 'Efficiency',
      value: metrics.efficiencyScore,
      max: 100,
    },
    {
      metric: 'Real Operations',
      value: normalizeValue(
        metrics.totalRealOperations,
        metrics.totalRealOperations + metrics.totalFictionalOperations
      ),
      max: 100,
    },
    {
      metric: 'Distance Efficiency',
      value: metrics.realDistancePercentage,
      max: 100,
    },
    {
      metric: 'Pickup Success',
      value: (metrics.realPickupSuccessRate + metrics.fictionalPickupSuccessRate) / 2,
      max: 100,
    },
    {
      metric: 'Dropoff Success',
      value: (metrics.realDropoffSuccessRate + metrics.fictionalDropoffSuccessRate) / 2,
      max: 100,
    },
  ];

  const series = [
    {
      label: 'Performance Metrics',
      data: performanceData.map(d => d.value),
      color: '#8b5cf6',
    },
  ];

  const metrics_names = performanceData.map(d => d.metric);

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('performanceRadar') || 'Performance Radar Analysis'}
      </h3>
      <RadarChart
        series={series}
        height={400}
        radar={{
          metrics: metrics_names.map((name, index) => ({
            name,
            min: 0,
            max: 100,
          })),
        }}
        slotProps={{
          legend: {
            direction: 'row',
            position: {vertical: 'bottom', horizontal: 'middle'},
            padding: 0,
          },
        }}
      />
      <div className="mt-4 pt-4 border-t border-surface-3">
        <p className="text-xs text-text-tertiary">
          {t('radarDescription') || 'All metrics normalized to 0-100 scale for comparison. Higher values indicate better performance.'}
        </p>
      </div>
    </div>
  );
}
