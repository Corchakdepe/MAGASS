"use client";

import * as React from "react";
import type {DateRange} from "react-day-picker";
import {Calendar} from "@/components/ui/calendar";
import {CardHeader, CardTitle} from "@/components/ui/card";
import {useLanguage} from "@/contexts/LanguageContext";

interface DateRangeStepProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  calendarMonth: Date;
  onMonthChange: (month: Date) => void;
}

export function DateRangeStep({
  range,
  onRangeChange,
  calendarMonth,
  onMonthChange,
}: DateRangeStepProps) {
  const {t} = useLanguage();

  return (
    <>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-xs font-medium text-text-primary">
          {t('selectDayRange')}
        </CardTitle>
      </CardHeader>
      <Calendar
        mode="range"
        selected={range}
        onSelect={onRangeChange}
        month={calendarMonth}
        onMonthChange={onMonthChange}
        className="rounded-md border-0"
      />
    </>
  );
}
