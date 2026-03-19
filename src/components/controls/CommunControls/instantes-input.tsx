"use client";

import * as React from "react";
import {Calendar as CalendarIcon} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {useLanguage} from "@/contexts/LanguageContext";
import {useInstantesState} from "./InstantesInput/hooks/useInstantesState";
import {useInstantesCalculation} from "./InstantesInput/hooks/useInstantesCalculation";
import {DateRangeStep} from "./InstantesInput/components/DateRangeStep";
import {TimePickerStep} from "./InstantesInput/components/TimePickerStep";
import {NavigationButtons} from "./InstantesInput/components/NavigationButtons";
import type {InstantesInputProps} from "./InstantesInput/types/instantes";

export function InstantesInput({deltaOutMin, value, onChange}: InstantesInputProps) {
  const {t} = useLanguage();

  const {
    open,
    setOpen,
    range,
    setRange,
    calendarMonth,
    setCalendarMonth,
    step,
    setStep,
    clockView,
    setClockView,
    fromTime,
    setFromTime,
    toTime,
    setToTime,
    resetFlow,
  } = useInstantesState();

  const {minutesStep, handleClockChange} = useInstantesCalculation({
    deltaOutMin,
    range,
    step,
    clockView,
    fromTime,
    setFromTime,
    setToTime,
    setStep,
    setClockView,
    setOpen,
    resetFlow,
    onChange,
  });

  const handleBack = () => {
    if (step === "fromTime") {
      setStep("date");
      setClockView("hours");
      setRange(undefined);
    } else if (step === "toTime") {
      setStep("fromTime");
      setClockView("hours");
    }
  };

  const handleCancel = () => {
    setOpen(false);
    resetFlow();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetFlow();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left text-xs h-9 font-normal rounded-md border-surface-3 bg-surface-1 hover:bg-surface-0/70"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? `Δ = ${value}` : t('selectRange')}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 rounded-lg border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
        align="start"
      >
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {step === "date" && (
              <DateRangeStep
                range={range}
                onRangeChange={setRange}
                calendarMonth={calendarMonth}
                onMonthChange={setCalendarMonth}
              />
            )}

            {step !== "date" && (
              <TimePickerStep
                step={step}
                clockView={clockView}
                time={step === "fromTime" ? fromTime : toTime}
                minutesStep={minutesStep}
                onTimeChange={handleClockChange}
                onClockViewChange={setClockView}
              />
            )}

            <NavigationButtons
              step={step}
              currentValue={value}
              onBack={handleBack}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
