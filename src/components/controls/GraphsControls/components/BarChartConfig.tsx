"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BarChartConfigProps {
  station: string;
  onStationChange: (value: string) => void;
  daysRange: DateRange | undefined;
  onDaysRangeChange: (range: DateRange | undefined) => void;
  days: string;
  onDaysChange: (value: string) => void;
  encodeRangeAsDayList: (range: DateRange | undefined) => string;
  useFilter: boolean;
}

function normalizeStation(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function RangeLabel({ range }: { range: DateRange | undefined }) {
  const { t } = useLanguage();
  if (!range?.from || !range?.to) return <>{t("allDays")}</>;
  return <>{`${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`}</>;
}

export function BarChartConfig({
  station,
  onStationChange,
  daysRange,
  onDaysRangeChange,
  days,
  onDaysChange,
  encodeRangeAsDayList,
  useFilter,
}: BarChartConfigProps) {
  const { t } = useLanguage();

  const handleRangeChange = (range: DateRange | undefined) => {
    onDaysRangeChange(range);
    const encoded = encodeRangeAsDayList(range);
    onDaysChange(encoded);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-surface-3/50">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
          {t("station")}
        </Label>
        <Input
          type="text"
          inputMode="numeric"
          className="h-8 text-sm rounded-md border-surface-3 bg-surface-1 focus:bg-surface-0 transition-colors text-text-primary placeholder:text-text-tertiary"
          value={station}
          onChange={(e) => onStationChange(normalizeStation(e.target.value))}
          disabled={useFilter}
          placeholder={useFilter ? t("usingFilter") : "99"}
        />
        {useFilter && (
          <p className="text-xs text-warning/90 px-1 font-medium">{t("filterOverridesStations")}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
          {t("dayRange")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left text-sm h-8 font-normal rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0 transition-colors px-2 text-text-primary"
            >
              <div className="flex items-center truncate">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-text-secondary" />
                <RangeLabel range={daysRange} />
              </div>
              <span className="text-xs text-text-secondary ml-2 shrink-0 font-mono bg-surface-2/50 px-1.5 py-0.5 rounded">
                {days || "all"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-lg border-surface-3 bg-surface-1 shadow-lg"
            align="start"
          >
            <Calendar
              mode="range"
              selected={daysRange}
              onSelect={handleRangeChange}
              initialFocus
              className="rounded-md border-0 text-text-primary"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
