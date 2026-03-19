"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useLanguage} from "@/contexts/LanguageContext";
import {AlertCircle} from "lucide-react";

interface ExceptionDaysInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExceptionDaysInput({value, onChange}: ExceptionDaysInputProps) {
  const {t} = useLanguage();

  const numericValue = parseInt(value) || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-warning" />
          <Label className="text-xs font-medium text-text-primary">
            {t('exceptions')}
          </Label>
        </div>
        {value && (
          <span className="text-xs font-semibold text-warning bg-warning/5 px-2 py-0.5 rounded-full border border-warning/10">
            {t('upTo')} {value} {t('days')}
          </span>
        )}
      </div>

      <div className="bg-surface-2/30 rounded-lg border border-surface-3/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              className="h-8 text-sm rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-warning/20"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="5"
            />
          </div>
          <div className="text-xs text-text-secondary whitespace-nowrap">
            {t('maxDays')}
          </div>
        </div>

        {/* Visual indicator of tolerance level */}
        <div className="mt-3 flex items-center gap-1">
          <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning transition-all duration-300"
              style={{ width: `${Math.min(numericValue * 10, 100)}%` }}
            />
          </div>
          <span className="text-[9px] text-text-tertiary">
            {numericValue > 10 ? 'High' : numericValue > 5 ? 'Medium' : 'Low'} tolerance
          </span>
        </div>
      </div>

      <p className="text-[10px] text-text-secondary italic border-l-2 border-warning/30 pl-2">
        {t('allowStationsToFailOnXDays')}
      </p>
    </div>
  );
}