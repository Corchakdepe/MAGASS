"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import {Calendar as CalendarIcon, ChevronDown} from "lucide-react";
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

  const dayCount = range?.from && range?.to
    ? dateDiffInDays(range.to, range.from) + 1
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="h-3.5 w-3.5 text-accent" />
        <Label className="text-xs font-medium text-text-primary">
          {t('dateRange')}
        </Label>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left text-xs h-9 font-normal rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70 group"
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              <span className="truncate">{displayText}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {dayCount && (
                <span className="text-[9px] font-medium bg-accent/5 text-accent px-1.5 py-0.5 rounded-full border border-accent/10">
                  {dayCount} {t('days')}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-text-tertiary transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-lg border-surface-3 bg-surface-1 shadow-lg"
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

      <p className="text-[10px] text-text-secondary italic border-l-2 border-accent/30 pl-2">
        {t('selectDayRangeForFiltering')}
      </p>
    </div>
  );
}