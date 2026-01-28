"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Calendar as CalendarIcon} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";

interface DayChartConfigProps {
  daysRange: DateRange | undefined;
  onDaysRangeChange: (range: DateRange | undefined) => void;
  days: string;
  onDaysChange: (value: string) => void;
  mode: "Suma" | "Media";
  onModeChange: (mode: "Suma" | "Media") => void;
  freq: string;
  onFreqChange: (value: string) => void;
  encodeRangeAsDayList: (range: DateRange | undefined) => string;
}

function RangeLabel({range}: {range: DateRange | undefined}) {
  const {t} = useLanguage();
  if (!range?.from || !range?.to) return <>{t('allDays')}</>;
  return <>{`${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`}</>;
}

export function DayChartConfig({
  daysRange,
  onDaysRangeChange,
  days,
  onDaysChange,
  mode,
  onModeChange,
  freq,
  onFreqChange,
  encodeRangeAsDayList,
}: DayChartConfigProps) {
  const {t} = useLanguage();

  const handleRangeChange = (range: DateRange | undefined) => {
    onDaysRangeChange(range);
    const encoded = encodeRangeAsDayList(range);
    onDaysChange(encoded);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-text-primary">
        {t('dayByDayChartConfiguration')}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('dayRange')}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left text-xs h-9 font-normal rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <RangeLabel range={daysRange} />
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
        <p className="text-[10px] text-text-tertiary">
          {t('currentValue')}: {days}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-text-secondary">
            {t('mode')}
          </Label>
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className="h-9 text-xs rounded-md border-surface-3 bg-surface-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
              <SelectItem value="Suma" className="text-xs">{t('sum')}</SelectItem>
              <SelectItem value="Media" className="text-xs">{t('average')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-text-secondary">
            {t('frequency')}
          </Label>
          <Input
            type="text"
            className="h-9 text-xs rounded-md border-surface-3 bg-surface-1"
            value={freq}
            onChange={(e) => onFreqChange(e.target.value)}
            placeholder="1, 7, 30…"
          />
        </div>
      </div>
    </div>
  );
}
