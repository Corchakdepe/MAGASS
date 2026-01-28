"use client";

import * as React from "react";
import {cn} from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function MetricCard({
  label,
  value,
  unit,
  variant = "default",
}: MetricCardProps) {
  const variantClasses = {
    default: "border-surface-3 bg-surface-1/85",
    success: "border-green-500/30 bg-green-500/10",
    warning: "border-yellow-500/30 bg-yellow-500/10",
    error: "border-red-500/30 bg-red-500/10",
  };

  return (
    <div
      className={cn(
        "rounded-lg border backdrop-blur-md p-4 space-y-2",
        variantClasses[variant]
      )}
    >
      <p className="text-xs text-text-secondary">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {unit && <span className="text-sm text-text-tertiary">{unit}</span>}
      </div>
    </div>
  );
}
