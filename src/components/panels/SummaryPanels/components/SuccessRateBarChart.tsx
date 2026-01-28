"use client";

import {BarChart} from "@mui/x-charts/BarChart";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type SuccessRateBarChartProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function SuccessRateBarChart({metrics, t}: SuccessRateBarChartProps) {
  const categories = metrics.successRateComparison.map((item) => item.category);
  const resolvedData = metrics.successRateComparison.map((item) => item.resolved);
  const unresolvedData = metrics.successRateComparison.map((item) => item.unresolved);

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('successRateComparison') || 'Success Rate Comparison'}
      </h3>
      <BarChart
        xAxis={[{scaleType: 'band', data: categories}]}
        series={[
          {data: resolvedData, label: 'Resolved', color: '#10b981'},
          {data: unresolvedData, label: 'Unresolved', color: '#ef4444'},
        ]}
        height={300}
        slotProps={{
          legend: {
            direction: 'row',
            position: {vertical: 'top', horizontal: 'middle'},
            padding: -5,
          },
        }}
      />
    </div>
  );
}
