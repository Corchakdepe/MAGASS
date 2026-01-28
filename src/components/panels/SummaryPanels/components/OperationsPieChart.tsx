"use client";

import {PieChart} from "@mui/x-charts/PieChart";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type OperationsPieChartProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function OperationsPieChart({metrics, t}: OperationsPieChartProps) {
  const data = metrics.operationsBreakdown.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: item.color,
  }));

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('operationsBreakdown') || 'Operations Breakdown'}
      </h3>
      <PieChart
        series={[
          {
            data,
            highlightScope: {faded: 'global', highlighted: 'item'},
            faded: {innerRadius: 30, additionalRadius: -30, color: 'gray'},
            innerRadius: 30,
            outerRadius: 100,
            paddingAngle: 2,
            cornerRadius: 5,
          },
        ]}
        height={300}
        slotProps={{
          legend: {
            direction: 'column',
            position: {vertical: 'middle', horizontal: 'right'},
            padding: 0,
          },
        }}
      />
    </div>
  );
}
