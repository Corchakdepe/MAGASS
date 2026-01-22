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
import {useLanguage} from "@/contexts/LanguageContext";

type InstantesInputProps = {
    deltaOutMin: number;
    value: string;
    onChange: (next: string) => void;
};

type Step = "date" | "fromTime" | "toTime";

const GENERIC_MONTH = new Date(2000, 0, 1); // Jan 2000

export function InstantesInput({deltaOutMin, value, onChange}: InstantesInputProps) {
    const {t} = useLanguage();

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
        <div>
            <div className="mt-3 flex-1 flex flex-col justify-between">
                <Popover
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v);
                        if (v) resetFlow();
                    }}
                >
                    <PopoverTrigger asChild>
                        <button
                            id="instantes"
                            type="button"
                            className={[
                                "w-full h-9 rounded-md border border-surface-3 bg-surface-1",
                                "px-3 text-xs text-text-primary",
                                "flex items-center justify-between gap-2",
                                "hover:bg-surface-0/70",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
                            ].join(" ")}
                        >
                            <span className="sr-only">{t('editInstants')}</span>

                            <span className="truncate text-text-secondary">
                                {value ? `Δ = ${value}` : t('selectRange')}
                            </span>
                            <span
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-surface-3 bg-surface-0">
                                <CalendarIcon className="h-3.5 w-3.5 text-accent"/>
                            </span>
                        </button>

                    </PopoverTrigger>

                    <PopoverContent
                        className="w-auto p-3 bg-surface-1 border border-surface-3 shadow-mac-panel"
                        align="end"
                    >
                        {step === "date" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-text-primary">
                                    {t('selectDayRange')}
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

                        {step !== "date" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-text-primary">
                                    {step === "fromTime" ? t('startTime') : t('endTime')} ({clockView === "hours" ? t('hours') : t('minutes')})
                                </Label>

                                <div className="rounded-md border border-surface-3 bg-surface-0/60 p-2">
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <MultiSectionDigitalClock
                                            views={["hours", "minutes"]}
                                            value={step === "fromTime" ? fromTime : toTime}
                                            onChange={onClockChange}
                                            minutesStep={minutesStep}
                                            onViewChange={(v) => setClockView(v as "hours" | "minutes")}
                                            referenceDate={dayjs().startOf("day")}
                                        />
                                    </LocalizationProvider>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 flex justify-between gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-text-secondary hover:text-text-primary"
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
                                {t('back')}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-text-secondary hover:text-text-primary"
                                onClick={() => {
                                    setOpen(false);
                                    resetFlow();
                                }}
                            >
                                {t('cancel')}
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

            </div>
            <div className="pt-2">
                <span
                    className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                    {t('currentValue')}: {value || "0"}
                </span>
            </div>
        </div>
    );

}
