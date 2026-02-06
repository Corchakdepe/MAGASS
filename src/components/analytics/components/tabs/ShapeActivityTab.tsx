"use client";

import React, { useMemo } from "react";
import { BarChart } from "@mui/x-charts";
import type { ActivityMetrics, ShapeMetrics } from "../../types/analytics";

export function ShapeActivityTab({
  shapes,
  activity,
}: {
  shapes: ShapeMetrics[];
  activity: ActivityMetrics[];
}) {
  const merged = useMemo(() => {
    const act = new Map(activity.map((a) => [a.stationId, a]));
    return shapes
      .map((s) => {
        const a = act.get(s.stationId);
        return {
          stationId: s.stationId,
          skewness: s.skewness,
          kurtosis: s.kurtosis,
          nonZeroPct: a ? a.nonZeroRatio * 100 : 0,
          zeroCount: a?.zeroCount ?? 0,
        };
      })
      // “most data”: show stations with the strongest shape (spiky/heavy-tail) first
      .sort((a, b) => Math.abs(b.kurtosis) - Math.abs(a.kurtosis));
  }, [shapes, activity]);

  const labels = merged.map((m) => m.stationId);

  return (
    <div className="space-y-6">
      {/* Shape chart */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">Distribution shape</div>

        <BarChart
          height={320}
          margin={{ top: 16, right: 16, bottom: 90, left: 60 }}
          grid={{ horizontal: true, vertical: false }}
          xAxis={[
            {
              data: labels,
              scaleType: "band",
              tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
            },
          ]}
          series={[
            { id: "skew", label: "Skewness", data: merged.map((m) => m.skewness) },
            { id: "kurt", label: "Kurtosis (excess)", data: merged.map((m) => m.kurtosis) },
          ]}
          slotProps={{ legend: { hidden: false }, tooltip: { trigger: "item" } }}
          axisHighlight={{ x: "band" }}
        />
      </div>

      {/* Activity chart */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">Activity (non-zero %)</div>

        <BarChart
          height={320}
          margin={{ top: 16, right: 16, bottom: 90, left: 60 }}
          grid={{ horizontal: true, vertical: false }}
          xAxis={[
            {
              data: labels,
              scaleType: "band",
              tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
            },
          ]}
          series={[
            { id: "nz", label: "Non-zero %", data: merged.map((m) => m.nonZeroPct) },
          ]}
          slotProps={{ legend: { hidden: false }, tooltip: { trigger: "item" } }}
          axisHighlight={{ x: "band" }}
        />
      </div>

      {/* Keep the detailed table */}
      <div className="rounded-lg border border-surface-3 bg-surface-1/85 p-4">
        <div className="text-sm font-semibold text-text-primary mb-3">Details</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-text-tertiary">
              <tr>
                <th className="text-left py-2 pr-3">Station</th>
                <th className="text-right py-2 pr-3">Skewness</th>
                <th className="text-right py-2 pr-3">Kurtosis</th>
                <th className="text-right py-2 pr-3">Non-zero %</th>
                <th className="text-right py-2 pr-3">Zeros</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {merged.map((m) => (
                <tr key={m.stationId} className="border-t border-surface-3/60">
                  <td className="py-2 pr-3">{m.stationId}</td>
                  <td className="py-2 pr-3 text-right">{m.skewness.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right">{m.kurtosis.toFixed(3)}</td>
                  <td className="py-2 pr-3 text-right">{m.nonZeroPct.toFixed(1)}</td>
                  <td className="py-2 pr-3 text-right">{m.zeroCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
