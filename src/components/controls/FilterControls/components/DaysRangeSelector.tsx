"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import {Calendar as CalendarIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {useLanguage} from "@/contexts/LanguageContext";
import {generateDaysList} from "../utils/filterHelpers";
import type {UnifiedFilterState} from "../types/filterControls";

interface DaysRangeSelectorProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  onFilterStateUpdate: (updates: Partial<UnifiedFilterState>) => void;
  dateDiffInDays: (to: Date, from: Date) => number;
}

export function DaysRangeSelector({
  range,
  onRangeChange,
  onFilterStateUpdate,
  dateDiffInDays,
}: DaysRangeSelectorProps) {
  const {t} = useLanguage();

  const handleRangeChange = (newRange: DateRange | undefined) => {
    onRangeChange(newRange);

    if (!newRange?.from || !newRange?.to) {
      onFilterStateUpdate({days: "all"});
      return;
    }

    const daysStr = generateDaysList(newRange.from, newRange.to, dateDiffInDays);
    onFilterStateUpdate({days: daysStr});
  };

  const displayText = !range?.from || !range?.to
    ? t('allDays')
    : `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-text-secondary">
        {t('days')}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left text-xs h-9 font-normal rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayText}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
          align="start"
        >
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleRangeChange}
            initialFocus
            className="rounded-md border-0"
          />
        </PopoverContent>
      </Popover>
      <p className="text-[10px] text-text-tertiary">
        {t('selectDayRangeForFiltering')}
      </p>
    </div>
  );
}
