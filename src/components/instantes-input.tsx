"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import type {DateRange} from "react-day-picker";
import {Calendar as CalendarIcon} from "lucide-react";

import dayjs, {Dayjs} from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {MultiSectionDigitalClock} from "@mui/x-date-pickers/MultiSectionDigitalClock";

import {Calendar} from "./ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "./ui/popover";
import {Button} from "./ui/button";
import {Label} from "./ui/label";
import {Card, CardContent, CardHeader, CardTitle} from "./ui/card";

type InstantesInputProps = {
    deltaOutMin: number;
    value: string;
    onChange: (next: string) => void;
};

type Step = "date" | "fromTime" | "toTime";

const GENERIC_MONTH = new Date(2000, 0, 1); // Jan 2000

export function InstantesInput({deltaOutMin, value, onChange}: InstantesInputProps) {
    const computeInstanteFromDayTime = (p: {
        day: number;
        hour: number;
        minute: number;
        deltaOutMin: number;
    }): number => {
        const {day, hour, minute, deltaOutMin} = p;
        const mins = hour * 60 + minute;
        const slot = mins / deltaOutMin;
        return day * (1440 / deltaOutMin) + slot;
    };

    const dateDiffInDays = (a: Date, b: Date) => {
        const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
        const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
        return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
    };

    const minutesStep = Math.max(1, deltaOutMin > 0 ? deltaOutMin : 1);

    // One popover only
    const [open, setOpen] = useState(false);

    // calendar
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => GENERIC_MONTH);

    // step + clock
    const [step, setStep] = useState<Step>("date");
    const [clockView, setClockView] = useState<"hours" | "minutes">("hours");

    const [fromTime, setFromTime] = useState<Dayjs>(() =>
        dayjs().hour(0).minute(0).second(0).millisecond(0),
    );
    const [toTime, setToTime] = useState<Dayjs>(() =>
        dayjs().hour(0).minute(0).second(0).millisecond(0),
    );

    const resetFlow = () => {
        setRange(undefined);
        setStep("date");
        setClockView("hours");
        setFromTime(dayjs().hour(0).minute(0).second(0).millisecond(0));
        setToTime(dayjs().hour(0).minute(0).second(0).millisecond(0));
        setCalendarMonth(GENERIC_MONTH);
    };

    // When popover opens, force generic month
    useEffect(() => {
        if (!open) return;
        setCalendarMonth(GENERIC_MONTH);
    }, [open]);

    // When date range is complete, move to FROM time step
    useEffect(() => {
        if (!range?.from || !range?.to) return;
        setStep("fromTime");
        setClockView("hours");
    }, [range?.from, range?.to]);

    const onClockChange = (newValue: Dayjs | null) => {
        if (!newValue || !range?.from || !range?.to || deltaOutMin <= 0) return;

        // snap minutes to delta
        let m = newValue.minute();
        if (minutesStep > 1) {
            m = Math.round(m / minutesStep) * minutesStep;
            if (m >= 60) m = 60 - minutesStep;
        }
        const next = newValue.minute(m).second(0).millisecond(0);

        // hours -> minutes
        if (clockView === "hours") {
            if (step === "fromTime") setFromTime(next);
            if (step === "toTime") setToTime(next);
            setClockView("minutes");
            return;
        }

        // minutes chosen -> advance / finish
        if (step === "fromTime") {
            setFromTime(next);
            setStep("toTime");
            setClockView("hours");
            return;
        }

        // step === "toTime": finalize diff and close
        setToTime(next);

        const dayTo = dateDiffInDays(range.to, range.from);
        if (dayTo < 0) return;

        const fromInst = computeInstanteFromDayTime({
            day: 0,
            hour: fromTime.hour(),
            minute: fromTime.minute(),
            deltaOutMin,
        });

        const toInst = computeInstanteFromDayTime({
            day: dayTo,
            hour: next.hour(),
            minute: next.minute(),
            deltaOutMin,
        });

        if (!Number.isInteger(fromInst) || !Number.isInteger(toInst)) return;

        const diff = toInst - fromInst;
        onChange(String(diff)); // replace previous value

        setOpen(false);
        resetFlow();
    };

   return (
    <Card className="h-full flex flex-col justify-between bg-brand-50 border border-brand-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-brand-700">
          Instantes (diff)
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div>
          <Popover
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (v) resetFlow();
            }}
          >
            <PopoverTrigger asChild>
              {/* BotÃ³n que imita el input con icono calendario */}
              <button
                id="instantes"
                type="button"
                className="w-full relative border border-input rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring flex items-center justify-between"
              >
                <span className="sr-only">Editar instantes</span>
                <span className="truncate">
                  {value ? `Î” = ${value}` : "Selecciona rango"}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-brand-50">
                  <CalendarIcon className="h-4 w-4 text-brand-600" />
                </span>
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-3" align="end">
              {/* Paso 1: rango de dÃ­as */}
              {step === "date" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-brand-700">
                    Selecciona rango de dÃ­as
                  </Label>
                  <Calendar
                    mode="range"
                    selected={range as DateRange | undefined}
                    onSelect={setRange}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                  />
                </div>
              )}

              {/* Paso 2â€“3: horas */}
              {step !== "date" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-brand-700">
                    {step === "fromTime" ? "Hora inicio" : "Hora fin"} ({clockView})
                  </Label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <MultiSectionDigitalClock
                      views={["hours", "minutes"]}
                      value={step === "fromTime" ? fromTime : toTime}
                      onChange={onClockChange}
                      minutesStep={minutesStep}
                      onViewChange={(v) =>
                        setClockView(v as "hours" | "minutes")
                      }
                      referenceDate={dayjs().startOf("day")}
                    />
                  </LocalizationProvider>
                </div>
              )}

              <div className="mt-3 flex justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (step === "fromTime") {
                      setStep("date");
                      setClockView("hours");
                      setRange(undefined as any);
                    } else if (step === "toTime") {
                      setStep("fromTime");
                      setClockView("hours");
                    }
                  }}
                >
                  AtrÃ¡s
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setOpen(false);
                    resetFlow();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Footer: valor actual + chip redondo con nÃºmero */}
        <div className="flex justify-between items-baseline mt-6">
          <span className="text-foreground text-sm font-bold">
            Valor actual: Î”={value || "â€”"}
          </span>
          <span className="bg-brand-200 text-brand-900 text-xs font-bold px-2.5 py-1 rounded-full">
            {value || "0"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}