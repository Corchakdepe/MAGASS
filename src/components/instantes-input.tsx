'use client';

import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import type {DateRange} from 'react-day-picker';
import {Calendar as CalendarIcon, Clock as ClockIcon} from 'lucide-react';

import dayjs, {Dayjs} from 'dayjs';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import {TimeClock} from '@mui/x-date-pickers/TimeClock';

import {Calendar} from './ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from './ui/popover';
import {Button} from './ui/button';
import {Label} from './ui/label';

type InstantesInputProps = {
  deltaOutMin: number;
  value: string;
  onChange: (next: string) => void;
};

export function InstantesInput(props: InstantesInputProps) {
  const { deltaOutMin, value, onChange } = props;

  // ---- helpers internos ----
  const parseInstantesLoose = (input: string): number[] => {
    const tokens = input
      .trim()
      .split(/[^0-9]+/g)
      .map(t => t.trim())
      .filter(Boolean);

    const nums = tokens
      .map(t => Number(t))
      .filter(n => Number.isFinite(n) && Number.isInteger(n) && n >= 0);

    return Array.from(new Set(nums)).sort((a, b) => a - b);
  };

  const formatInstantesCanonical = (nums: number[]): string => nums.join(';');

  const computeInstanteFromDayTime = (p: {
    day: number;
    hour: number;
    minute: number;
    deltaOutMin: number;
  }): number => {
    const { day, hour, minute, deltaOutMin } = p;
    const mins = hour * 60 + minute;
    const slot = mins / deltaOutMin;
    return day * (1440 / deltaOutMin) + slot;
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');

  // ---- range selection (base -> target) ----
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ---- time selection (MUI TimeClock) ----
  const [timeOpen, setTimeOpen] = useState(false);
  const [clockValue, setClockValue] = useState<Dayjs>(() =>
    dayjs().hour(0).minute(0).second(0).millisecond(0),
  );

  // ---- feedback ----
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const baseDate = range?.from;
  const selectedDate = range?.to;

  const instPerDay = useMemo(() => {
    if (!deltaOutMin || deltaOutMin <= 0) return 0;
    return 1440 / deltaOutMin;
  }, [deltaOutMin]);

  const normalizeValue = (raw: string) =>
    formatInstantesCanonical(parseInstantesLoose(raw));

  const onPasteCanonicalize = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const merged = value ? `${value};${text}` : text;
    e.preventDefault();
    onChange(normalizeValue(merged));
  };

  const dateDiffInDays = (a: Date, b: Date) => {
    const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
  };

  const dayIndex =
    baseDate && selectedDate ? dateDiffInDays(selectedDate, baseDate) : null;

  const minutesStep = Math.max(1, deltaOutMin > 0 ? deltaOutMin : 1);

  const minuteOk = useMemo(() => {
    if (deltaOutMin <= 0) return true;
    return clockValue.minute() % deltaOutMin === 0;
  }, [clockValue, deltaOutMin]);

  const pendingInstante = useMemo(() => {
    if (!deltaOutMin || deltaOutMin <= 0) return null;
    if (!baseDate || !selectedDate) return null;
    if (dayIndex === null || dayIndex < 0) return null;
    if (!minuteOk) return null;

    const inst = computeInstanteFromDayTime({
      day: dayIndex,
      hour: clockValue.hour(),
      minute: clockValue.minute(),
      deltaOutMin,
    });

    return Number.isInteger(inst) ? inst : null;
  }, [deltaOutMin, baseDate, selectedDate, dayIndex, minuteOk, clockValue]);

  const insertInstante = (inst: number) => {
    const current = parseInstantesLoose(value);
    const next = Array.from(new Set([...current, inst])).sort((a, b) => a - b);
    onChange(formatInstantesCanonical(next));

    setLastAdded(inst);
    setFlash(true);
    setTimeout(() => setFlash(false), 450);
  };

  // Calendar click1 sets base, click2 sets target
  const onDayClick = (day: Date) => {
    setRange(prev => {
      if (!prev?.from || prev.to) return { from: day, to: undefined };

      const from = prev.from;
      const to = day;

      if (to < from) return { from: to, to: from };
      return { from, to };
    });
  };

  // After selecting target, open time automatically
  useEffect(() => {
    if (range?.from && range?.to) {
      setCalendarOpen(false);
      setTimeOpen(true);
    }
  }, [range?.from, range?.to]);

  // AUTO INSERT: when clockValue changes while time popover open and pending is valid
  useEffect(() => {
    if (!timeOpen) return;
    if (pendingInstante === null) return;

    insertInstante(pendingInstante);

    // close and reset flow for next add
    setTimeOpen(false);
    setRange(undefined);
    setClockValue(dayjs().hour(0).minute(0).second(0).millisecond(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockValue]);

  const calendarButtonText = (() => {
    if (!range?.from) return 'Selecciona fecha';
    if (!range?.to) return `${range.from.toLocaleDateString()}`;
    return `Base: ${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}`;
  })();

  const timeButtonText = `${pad2(clockValue.hour())}:${pad2(clockValue.minute())}`;

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] text-muted-foreground">
          Instantes
        </Label>

        {/* Small preview */}
        <div
          className="max-w-[220px] truncate text-[11px] text-muted-foreground"
          title={value}
        >
          {value || '—'}
        </div>
      </div>

      {/* Control box */}
      <div className="flex items-center justify-between gap-2 rounded-md border border-muted bg-muted/30 p-2">
        <div className="flex items-center gap-2">
          {/* Calendar */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label={calendarButtonText}
                title={calendarButtonText}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0">
              <Calendar
                mode="range"
                selected={range}
                onDayClick={onDayClick}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Time */}
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label={`Seleccionar hora (${timeButtonText})`}
                title={`Seleccionar hora (${timeButtonText})`}
              >
                <ClockIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-2">
              <div style={{ minHeight: 300 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimeClock
                    value={clockValue}
                    onChange={(newValue) => {
                      if (!newValue) return;

                      let m = newValue.minute();
                      if (minutesStep > 1) {
                        m = Math.round(m / minutesStep) * minutesStep;
                        if (m >= 60) m = 60 - minutesStep;
                      }

                      setClockValue(
                        newValue.minute(m).second(0).millisecond(0),
                      );
                    }}
                    views={['hours', 'minutes']}
                    minutesStep={minutesStep}
                  />
                </LocalizationProvider>
              </div>

              {!minuteOk && (
                <div className="pt-1 text-[11px] text-destructive">
                  Minuto debe ser múltiplo de Δ={deltaOutMin}.
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Right-side status */}
        <div className="text-[11px] text-muted-foreground">
          {pendingInstante !== null
            ? `Añadir: ${pendingInstante}`
            : `Δ=${deltaOutMin}`}
        </div>
      </div>
    </div>
  );
}
