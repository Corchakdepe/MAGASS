"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const [inputValue, setInputValue] = useState<string>(delta.toString());

  // Update local state when prop changes externally
  useEffect(() => {
    setInputValue(delta.toString());
  }, [delta]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Allow empty input for better UX
    if (newValue === '') {
      return;
    }

    // Parse number and update parent if valid
    const num = parseInt(newValue, 10);
    if (!isNaN(num)) {
      setDelta(num);
    }
  };

  const handleBlur = () => {
    // Validate and clamp on blur
    let num = parseInt(inputValue, 10);

    if (isNaN(num) || inputValue === '') {
      num = 60; // Default value
    }

    // Apply min/max constraints
    num = Math.max(1, Math.min(1440, num));

    // Update both local and parent state
    setInputValue(num.toString());
    setDelta(num);
  };

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
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        step="any" // Allow any step
        className={cn(
          "w-full rounded-md border border-surface-3 bg-surface-1",
          "focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent transition-all",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        )}
      />
      <div className={cn(
        "text-text-tertiary",
        compact ? "text-[10px]" : "text-xs"
      )}>
        Time interval for simulation analysis (1-1440 minutes)
      </div>
    </div>
  );
}