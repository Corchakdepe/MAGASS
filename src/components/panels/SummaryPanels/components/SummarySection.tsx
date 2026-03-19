"use client";

import * as React from "react";
import {SummaryCard} from "./SummaryCard";
import type {SummarySection as SummarySectionType} from "../types/summary";

interface SummarySectionProps {
  section: SummarySectionType;
}

export function SummarySection({section}: SummarySectionProps) {
  return (
    <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        {section.title}
      </h3>
      <div className="space-y-3">
        {section.items.map((item, idx) => (
          <SummaryCard key={idx} data={item} />
        ))}
      </div>
    </div>
  );
}
