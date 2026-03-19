"use client";

import {BarChart} from "@mui/x-charts/BarChart";
import type {SummaryMetrics} from "../hooks/useSummaryMetrics";

type DistanceBarChartProps = {
  metrics: SummaryMetrics;
  t: (key: string) => string;
};

export function DistanceBarChart({metrics, t}: DistanceBarChartProps) {
  const categories = metrics.distanceDistribution.map((item) => item.category);
  const distances = metrics.distanceDistribution.map((item) => item.distance);

  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        {t('distanceDistribution') || 'Distance Distribution (km)'}
      </h3>
      <BarChart
        yAxis={[
          {
            scaleType: 'band',
            data: categories,
          },
        ]}
        series={[
          {
            data: distances,
            label: t('distance'),
            color: '#8b5cf6',
          },
        ]}
        height={300}
        layout="horizontal"
      />
      <div className="mt-4 pt-4 border-t border-surface-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-text-secondary">{t("totalDistance")}</p>
            <p className="text-lg font-bold text-text-primary">
              {metrics.totalDistance.toFixed(2)} km
            </p>
          </div>
          <div>
            <p className="text-text-secondary">{t("AvgPerPperation")}</p>
            <p className="text-lg font-bold text-text-primary">
              {metrics.avgDistancePerOperation.toFixed(2)} km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
