// src/components/visualizations/directory-subtraction/components/ParameterComparison.tsx
import React from "react";
import { AlertCircle } from "lucide-react";
import { Simulation } from "../types/types";
import { extractParams } from "../hooks/utils";

interface Props { sim1: Simulation; sim2: Simulation; }

const PARAMS = [
  { key: "stress",     label: "Stress" },
  { key: "walkCost",   label: "Walk Cost" },
  { key: "delta",      label: "Delta" },
  { key: "stressType", label: "Stress Type" },
] as const;

export default function ParameterComparison({ sim1, sim2 }: Props) {
  const p1 = extractParams(sim1.name);
  const p2 = extractParams(sim2.name);
  const hasDiff = PARAMS.some(({ key }) => p1[key] !== p2[key]);

  return (
    <div className="bg-surface-1 rounded-xl shadow-mac-panel overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-2">
        {hasDiff && <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />}
        <span className="text-xs font-semibold text-text-primary">
          {hasDiff ? "Parameter differences detected" : "Parameters match"}
        </span>
      </div>

      {/* Table */}
      <div className="grid grid-cols-[auto_1fr_1fr] text-xs divide-y divide-surface-2">
        {/* Column headers */}
        <div className="px-3 py-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wide" />
        <div className="px-3 py-1.5 text-[10px] font-semibold text-accent uppercase tracking-wide">A</div>
        <div className="px-3 py-1.5 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">B</div>

        {PARAMS.map(({ key, label }) => {
          const differs = p1[key] !== p2[key];
          return (
            <React.Fragment key={key}>
              <div className="px-3 py-2 text-text-tertiary font-medium">{label}</div>
              <div className={`px-3 py-2 font-code ${differs ? "text-warning font-semibold" : "text-text-primary"}`}>
                {p1[key]}
              </div>
              <div className={`px-3 py-2 font-code ${differs ? "text-warning font-semibold" : "text-text-primary"}`}>
                {p2[key]}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
