"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Calendar} from "@/components/ui/calendar";
import {Calendar as CalendarIcon} from "lucide-react";
import {useLanguage} from "@/contexts/LanguageContext";

interface BarChartConfigProps {
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

export function BarChartConfig({
  stations,
  onStationsChange,
  daysRange,
  onDaysRangeChange,
  days,
  onDaysChange,
  encodeRangeAsDayList,
  useFilter,
}: BarChartConfigProps) {
  const {t} = useLanguage();

  const handleRangeChange = (range: DateRange | undefined) => {
    onDaysRangeChange(range);
    const encoded = encodeRangeAsDayList(range);
    onDaysChange(encoded);
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-text-primary">
        {t('barChartConfiguration')}
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('stations')}
        </Label>
        <Autocomplete
          freeSolo
          options={[]}
          value={stations}
          onInputChange={(_, val) => onStationsChange(val)}
          disabled={useFilter}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={useFilter ? t('usingFilter') : "1;2;3;…"}
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "0.75rem",
                  height: "2.25rem",
                },
              }}
            />
          )}
        />
        {useFilter && (
          <p className="text-[10px] text-warning">{t('filterOverridesStations')}</p>
        )}
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
    </div>
  );
}
