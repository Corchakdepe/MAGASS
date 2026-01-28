"use client";

import {RadarChart} from "@mui/x-charts/RadarChart";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type OperationsComparisonRadarProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function OperationsComparisonRadar({metrics, t}: OperationsComparisonRadarProps) {
  // Define the metrics for comparison
  const metricNames = [
    'Pickup Success',
    'Dropoff Success',
    'Distance Efficiency',
    'Volume',
    'Resolution Rate',
  ];

  // Calculate values for Real operations
  const realOperationsData = [
    metrics.realPickupSuccessRate,
    metrics.realDropoffSuccessRate,
    metrics.realDistancePercentage,
    (metrics.totalRealOperations / (metrics.totalRealOperations + metrics.totalFictionalOperations)) * 100,
    ((metrics.realPickupSuccessRate + metrics.realDropoffSuccessRate) / 2),
  ];

  // Calculate values for Fictional operations
  const fictionalOperationsData = [
    metrics.fictionalPickupSuccessRate,
    metrics.fictionalDropoffSuccessRate,
    metrics.fictionalDistancePercentage,
    (metrics.totalFictionalOperations / (metrics.totalRealOperations + metrics.totalFictionalOperations)) * 100,
    ((metrics.fictionalPickupSuccessRate + metrics.fictionalDropoffSuccessRate) / 2),
  ];

  const series = [
    {
      label: 'Real Operations',
      data: realOperationsData,
      color: '#10b981',
    },
    {
      label: 'Fictional Operations (Rebalancing)',
      data: fictionalOperationsData,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('operationsComparison') || 'Real vs Fictional Operations Comparison'}
      </h3>
      <RadarChart
        series={series}
        height={400}
        radar={{
          metrics: metricNames.map((name) => ({
            name,
            min: 0,
            max: 100,
          })),
          startAngle: 90,
        }}
        shape="circular"
        slotProps={{
          legend: {
            direction: 'row',
            position: {vertical: 'bottom', horizontal: 'middle'},
            padding: -5,
          },
        }}
      />
      <div className="mt-4 pt-4 border-t border-surface-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-text-secondary font-medium">Real Operations</span>
            </div>
            <p className="text-text-tertiary">
              User-generated demand and actual bike movements
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-text-secondary font-medium">Fictional Operations</span>
            </div>
            <p className="text-text-tertiary">
              System rebalancing to maintain optimal distribution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
