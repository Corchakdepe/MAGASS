"use client";

import * as React from "react";
import type {Dayjs} from "dayjs";
import dayjs from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {MultiSectionDigitalClock} from "@mui/x-date-pickers/MultiSectionDigitalClock";
import {CardHeader, CardTitle} from "@/components/ui/card";
import {useLanguage} from "@/contexts/LanguageContext";
import type {Step, ClockView} from "../types/instantes";

interface TimePickerStepProps {
  step: Step;
  clockView: ClockView;
  time: Dayjs;
  minutesStep: number;
  onTimeChange: (time: Dayjs | null) => void;
  onClockViewChange: (view: ClockView) => void;
}

export function TimePickerStep({
  step,
  clockView,
  time,
  minutesStep,
  onTimeChange,
  onClockViewChange,
}: TimePickerStepProps) {
  const {t} = useLanguage();

  const title =
    step === "fromTime"
      ? `${t('startTime')} (${clockView === "hours" ? t('hours') : t('minutes')})`
      : `${t('endTime')} (${clockView === "hours" ? t('hours') : t('minutes')})`;

  return (
    <>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-xs font-medium text-text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MultiSectionDigitalClock
          value={time}
          onChange={onTimeChange}
          view={clockView}
          onViewChange={onClockViewChange as any}
          minutesStep={minutesStep}
          referenceDate={dayjs().startOf("day")}
        />
      </LocalizationProvider>
    </>
  );
}
