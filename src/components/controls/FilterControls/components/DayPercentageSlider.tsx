"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";
import type {UnifiedFilterState} from "../types/filterControls";

interface DayPercentageSliderProps {
  value: string;
  onChange: (value: string) => void;
}

export function DayPercentageSlider({value, onChange}: DayPercentageSliderProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-text-secondary">
        {t('dayPercentage')}
      </Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={value || "0"}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-accent h-2 rounded-lg appearance-none bg-surface-2 cursor-pointer"
        />
        <span className="text-xs text-text-primary font-medium min-w-[3rem] text-right">
          {value || 0}%
        </span>
      </div>
      <p className="text-[10px] text-text-tertiary">
        {t('minimumDayCompletionPercentage')}
      </p>
    </div>
  );
}
