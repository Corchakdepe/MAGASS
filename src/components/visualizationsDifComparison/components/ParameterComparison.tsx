// src/components/visualizations/directory-subtraction/ParameterComparison.tsx

import React from "react";
import { AlertCircle } from "lucide-react";
import { Simulation } from "../types/types";
import { extractParams } from "../hooks/utils";

interface Props {
  sim1: Simulation;
  sim2: Simulation;
}

export default function ParameterComparison({ sim1, sim2 }: Props) {
  const params1 = extractParams(sim1.name);
  const params2 = extractParams(sim2.name);

  const diff = {
    stress: params1.stress !== params2.stress,
    walkCost: params1.walkCost !== params2.walkCost,
    delta: params1.delta !== params2.delta,
    stressType: params1.stressType !== params2.stressType,
  };

  const hasDiff = diff.stress || diff.walkCost || diff.delta || diff.stressType;

  return (
    <div className="bg-surface-0 rounded-lg p-4">
      <h4 className="text-xs font-medium text-text-secondary mb-3">Parameter Comparison</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-2">First Simulation</p>
          <div className="space-y-1.5">
            {[
              ["Stress:", params1.stress],
              ["Walk Cost:", params1.walkCost],
              ["Delta:", `${params1.delta} min`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-text-secondary">{label}</span>
                <span className="text-text-primary font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-2">Second Simulation</p>
          <div className="space-y-1.5">
            {(
              [
                ["Stress:", params2.stress, diff.stress],
                ["Walk Cost:", params2.walkCost, diff.walkCost],
                ["Delta:", `${params2.delta} min`, diff.delta],
              ] as [string, string, boolean][]
            ).map(([label, value, isDiff]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-text-secondary">{label}</span>
                <span className={`font-medium ${isDiff ? "text-warning" : "text-text-primary"}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {hasDiff && (
        <div className="mt-3 text-[10px] text-warning flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Different parameters will be highlighted in the result</span>
        </div>
      )}
    </div>
  );
}
