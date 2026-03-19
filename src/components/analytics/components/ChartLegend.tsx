"use client";

import * as React from "react";
import {cn} from "@/lib/utils";
import type {ChartSeries} from "../types/analytics";

interface ChartLegendProps {
  series: ChartSeries[];
  onToggleSeries?: (seriesName: string) => void;
  activeSeries?: string[];
}

export function ChartLegend({
  series,
  onToggleSeries,
  activeSeries = [],
}: ChartLegendProps) {
  const isActive = (name: string) =>
    activeSeries.length === 0 || activeSeries.includes(name);

  return (
    <div className="flex flex-wrap gap-3 mt-4 justify-center">
      {series.map((s) => (
        <button
          key={s.name}
          onClick={() => onToggleSeries?.(s.name)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-all",
            isActive(s.name)
              ? "bg-surface-0/70 text-text-primary"
              : "bg-surface-0/30 text-text-tertiary opacity-50"
          )}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{backgroundColor: s.color || "#3b82f6"}}
          />
          <span>{s.name}</span>
        </button>
      ))}
    </div>
  );
}
