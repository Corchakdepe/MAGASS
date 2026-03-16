"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Calendar as CalendarIcon} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";

interface LineChartConfigProps {
  stations: string;
  onStationsChange: (value: string) => void;
  daysRange: DateRange | undefined;
  onDaysRangeChange: (range: DateRange | undefined) => void;
  days: string;
  onDaysChange: (value: string) => void;
  encodeRangeAsDayList: (range: DateRange | undefined) => string;
  useFilter: boolean;
}

function RangeLabel({range}: {range: DateRange | undefined}) {
  const {t} = useLanguage();
  if (!range?.from || !range?.to) return <>{t('allDays')}</>;
  return <>{`${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`}</>;
}

export function LineChartConfig({
  stations,
  onStationsChange,
  daysRange,
  onDaysRangeChange,
  days,
  onDaysChange,
  encodeRangeAsDayList,
  useFilter,
}: LineChartConfigProps) {
  const {t} = useLanguage();

  const handleRangeChange = (range: DateRange | undefined) => {
    onDaysRangeChange(range);
    const encoded = encodeRangeAsDayList(range);
    onDaysChange(encoded);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-surface-3/50">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
          {t('stations')}
        </Label>
        <Input
          type="text"
          className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors"
          value={stations}
          onChange={(e) => onStationsChange(e.target.value)}
          disabled={useFilter}
          placeholder={useFilter ? t('usingFilter') : "1;2;3..."}
        />
        {useFilter && (
          <p className="text-[10px] text-warning px-1">{t('filterOverridesStations')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
          {t('dayRange')}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left text-xs h-8 font-normal rounded-md border-surface-3 bg-surface-1/50 hover:bg-surface-0 transition-colors px-2"
            >
              <div className="flex items-center truncate">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-text-tertiary" />
                <RangeLabel range={daysRange} />
              </div>
              <span className="text-[10px] text-text-tertiary ml-2 shrink-0">{days}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
            align="start"
          >
            <Calendar
              mode="range"
              selected={daysRange}
              onSelect={handleRangeChange}
              initialFocus
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
