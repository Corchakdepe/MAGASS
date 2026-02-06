"use client";

import React, { useMemo } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import type { LagCorrelation, RollingMetrics, TrendMetrics } from "../../types/analytics";

export function TrendTab({
  trends,
  rolling,
  lagComparisons,
}: {
  trends: TrendMetrics[];
  rolling: RollingMetrics[];
  lagComparisons: LagCorrelation[];
}) {
  const trendChart = useMemo(() => {
    const ordered = [...trends].sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
    return {
      labels: ordered.map((t) => t.stationId),
      slope: ordered.map((t) => t.slope),
      r2: ordered.map((t) => t.r2),
    };
  }, [trends]);

  const rollingChart = useMemo(() => {
    // Show "most informative": top 3 stations by max rolling std-dev
    const ranked = [...rolling]
      .map((r) => ({
        ...r,
        max: r.rollingStdDev.length ? Math.max(...r.rollingStdDev) : 0,
      }))
      .sort((a, b) => b.max - a.max)
      .slice(0, 3);

    const maxLen = Math.max(0, ...ranked.map((r) => r.rollingStdDev.length));
    return {
      x: Array.from({ length: maxLen }, (_, i) => i),
      series: ranked.map((r) => ({
        id: r.stationId,
        label: `${r.stationId} (w=${r.window})`,
        data: r.rollingStdDev,
      })),
    };
  }, [rolling]);

  const lagTop = useMemo(() => {
    return [...lagComparisons]
      .sort((a, b) => b.bestCorrelation - a.bestCorrelation)
      .slice(0, 12);
  }, [lagComparisons]);

  return (
    <div className="space-y-6">
      {/* Trend charts */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">Trend (slope) & fit (R²)</div>

        <BarChart
          height={320}
          margin={{ top: 16, right: 16, bottom: 90, left: 60 }}
          grid={{ horizontal: true, vertical: false }}
          xAxis={[
            {
              data: trendChart.labels,
              scaleType: "band",
              tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
            },
          ]}
          series={[
            { id: "slope", label: "Slope", data: trendChart.slope },
            { id: "r2", label: "R²", data: trendChart.r2 },
          ]}
          slotProps={{ legend: { hidden: false }, tooltip: { trigger: "item" } }}
          axisHighlight={{ x: "band" }}
        />
      </div>

      {/* Rolling volatility chart */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">
          Rolling volatility (std dev) — top 3 stations
        </div>

        <LineChart
          height={320}
          margin={{ top: 16, right: 16, bottom: 50, left: 60 }}
          grid={{ horizontal: true, vertical: false }}
          xAxis={[{ data: rollingChart.x, scaleType: "linear", label: "Index" }]}
          series={rollingChart.series as any}
          slotProps={{ legend: { hidden: false }, tooltip: { trigger: "item" } }}
          axisHighlight={{ x: "line" }}
        />
      </div>

      {/* Lag table (still useful) */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">Lead/Lag — top correlations</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr>
                <th className="text-left py-2 pr-3">Station 1</th>
                <th className="text-left py-2 pr-3">Station 2</th>
                <th className="text-right py-2 pr-3">Best corr</th>
                <th className="text-right py-2 pr-3">Best lag</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {lagTop.map((c, idx) => (
                <tr key={`${c.station1}-${c.station2}-${idx}`} className="border-t border-surface-3/60">
                  <td className="py-2 pr-3">{c.station1}</td>
                  <td className="py-2 pr-3">{c.station2}</td>
                  <td className="py-2 pr-3 text-right">{c.bestCorrelation.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right">{c.bestLag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
