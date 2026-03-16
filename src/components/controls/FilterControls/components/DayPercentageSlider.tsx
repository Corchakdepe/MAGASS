"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";
import {Percent} from "lucide-react";
import type {UnifiedFilterState} from "../types/filterControls";

interface DayPercentageSliderProps {
  value: string;
  onChange: (value: string) => void;
}

export function DayPercentageSlider({value, onChange}: DayPercentageSliderProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Percent className="h-3.5 w-3.5 text-accent" />
          <Label className="text-xs font-medium text-text-primary">
            {t('coverageThreshold')}
          </Label>
        </div>
        <span className="text-xs font-semibold text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
          {value || 0}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value || "0"}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-1.5 rounded-lg appearance-none bg-surface-3 cursor-pointer accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-1 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
        </div>

        <div className="flex justify-between text-[9px] text-text-tertiary px-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <p className="text-[10px] text-text-secondary italic border-l-2 border-accent/30 pl-2">
        {t('minimumDayCompletionPercentage')}
      </p>
    </div>
  );
}