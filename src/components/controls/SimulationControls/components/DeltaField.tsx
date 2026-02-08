"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
// DeltaField.tsx - Updated with compact version
import { cn } from "@/lib/utils";
type Props = {
  delta: number;
  setDelta: (v: number) => void;
};



export function DeltaField({
  delta,
  setDelta,
  compact = false
}: {
  delta: number;
  setDelta: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className={cn(
        "font-medium",
        compact ? "text-xs text-text-secondary" : "text-sm text-text-secondary"
      )}>
        Delta (minutes)
      </label>
      <input
        type="number"
        min="1"
        max="1440"
        value={delta}
        onChange={(e) => setDelta(Math.max(1, parseInt(e.target.value) || 60))}
        className={cn(
          "w-full rounded-md border border-surface-3 bg-surface-1",
          "focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent transition-all",
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        )}
      />
      <div className={cn(
        "text-text-tertiary",
        compact ? "text-[10px]" : "text-xs"
      )}>
        Time interval for simulation analysis
      </div>
    </div>
  );
}