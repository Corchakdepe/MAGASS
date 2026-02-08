"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface SimulationNameFieldProps {
  simName: string;
  setSimName: (v: string) => void;
  compact?: boolean;
}

export function SimulationNameField({
  simName,
  setSimName,
  compact = false
}: SimulationNameFieldProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex items-center justify-between">
        <label className={cn(
          "font-medium flex items-center gap-1.5",
          compact ? "text-xs text-text-secondary" : "text-sm text-text-secondary"
        )}>
          <FileText className={cn(
            "text-text-tertiary",
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
          Simulation Name
        </label>
        {simName.trim() && (
          <span className={cn(
            "text-success font-medium",
            compact ? "text-[10px]" : "text-xs"
          )}>
            ✓ Valid
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={simName}
          onChange={(e) => setSimName(e.target.value)}
          placeholder="Enter a descriptive name..."
          className={cn(
            "w-full rounded-md border bg-surface-1 placeholder:text-text-tertiary/60",
            "focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent transition-all",
            "pr-10",
            compact
              ? "px-3 py-2 text-xs border-surface-3"
              : "px-3.5 py-2.5 text-sm border-surface-3"
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className={cn(
            "rounded-full",
            simName.trim()
              ? "bg-success/20 text-success"
              : "bg-surface-3 text-text-tertiary"
          )}>
          </div>
        </div>
      </div>
      {!simName.trim() && (
        <p className={cn(
          "text-warning",
          compact ? "text-[10px]" : "text-xs"
        )}>
          Please enter a simulation name
        </p>
      )}
    </div>
  );
}