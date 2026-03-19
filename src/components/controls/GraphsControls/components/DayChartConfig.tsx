"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DayChartConfigProps {
  daysRange: DateRange | undefined;
  onDaysRangeChange: (range: DateRange | undefined) => void;
  days: string;
  onDaysChange: (value: string) => void;
  mode: "X" | "M";
  onModeChange: (mode: "X" | "M") => void;
  freq: boolean;
  onFreqChange: (value: boolean) => void;
  encodeRangeAsDayList: (range: DateRange | undefined) => string;
}

function RangeLabel({ range }: { range: DateRange | undefined }) {
  const { t } = useLanguage();
  if (!range?.from || !range?.to) return <>{t("allDays")}</>;
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
          {t("dayRange")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left text-xs h-8 font-normal rounded-md border-surface-3 bg-surface-1/50 hover:bg-surface-0 transition-colors px-2"
            >
              <div className="flex items-center truncate">
                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-text-primary" />
                <RangeLabel range={daysRange} />
              </div>
              <span className="text-[10px] text-text-tertiary ml-2 shrink-0">
                {days || "all"}
              </span>
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

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
            {t("mode")}
          </Label>
          <Select value={mode} onValueChange={(value) => onModeChange(value as "X" | "M")}>
            <SelectTrigger className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
              <SelectItem value="X" className="text-xs">
                {t("sum")}
              </SelectItem>
              <SelectItem value="M" className="text-xs">
                {t("average")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="day-chart-frequency"
            checked={freq}
            onCheckedChange={(checked) => onFreqChange(Boolean(checked))}
            className="border-surface-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
          />
          <Label
            htmlFor="day-chart-frequency"
            className="text-xs font-medium text-text-primary cursor-pointer"
          >
            {t("frequency")}
          </Label>
        </div>
      </div>
    </div>
  );
}
