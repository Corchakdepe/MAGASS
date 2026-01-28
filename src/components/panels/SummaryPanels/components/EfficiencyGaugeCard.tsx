"use client";

import {Gauge, gaugeClasses} from "@mui/x-charts/Gauge";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type EfficiencyGaugeCardProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function EfficiencyGaugeCard({metrics, t}: EfficiencyGaugeCardProps) {
  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('systemEfficiency') || 'System Efficiency Score'}
      </h3>
      <div className="flex flex-col items-center">
        <Gauge
          value={metrics.efficiencyScore}
          startAngle={-110}
          endAngle={110}
          height={200}
          sx={{
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: 32,
              fontWeight: 'bold',
              fill: getEfficiencyColor(metrics.efficiencyScore),
            },
            [`& .${gaugeClasses.valueArc}`]: {
              fill: getEfficiencyColor(metrics.efficiencyScore),
            },
          }}
          text={({value}) => `${value.toFixed(0)}/100`}
        />
        <div className="mt-4 w-full space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Overall Success Rate</span>
            <span className="text-text-primary font-mono">
              {metrics.overallSuccessRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Distance Efficiency</span>
            <span className="text-text-primary font-mono">
              {((metrics.realDistance / (metrics.realDistance + metrics.fictionalDistance)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
