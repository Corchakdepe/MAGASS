"use client";

import * as React from "react";
import type {SummaryData} from "../types/summary";

interface SummaryCardProps {
  data: SummaryData;
}

export function SummaryCard({data}: SummaryCardProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-text-secondary">{data.title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-text-primary">
            {data.value}
          </span>
          {data.unit && (
            <span className="text-xs text-text-tertiary">{data.unit}</span>
          )}
        </div>
      </div>
      {data.description && (
        <p className="text-[10px] text-text-tertiary">{data.description}</p>
      )}
    </div>
  );
}
