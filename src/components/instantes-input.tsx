'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';

import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

type InstantesInputProps = {
  deltaOutMin: number;
  value: string;
  onChange: (next: string) => void;

  // Inject helpers from statistics-form.tsx
  parseInstantesLoose: (input: string) => number[];
  formatInstantesCanonical: (nums: number[]) => string;
  computeInstanteFromDayTime: (p: { day: number; hour: number; minute: number; deltaOutMin: number }) => number;
  pad2: (n: number) => string;
};

export function InstantesInput(props: InstantesInputProps) {
  const {
    deltaOutMin,
    value,
    onChange,
    parseInstantesLoose,
    formatInstantesCanonical,
    computeInstanteFromDayTime,
    pad2,
  } = props;

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

  const normalizeValue = (raw: string) => formatInstantesCanonical(parseInstantesLoose(raw));

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

  const dayIndex = baseDate && selectedDate ? dateDiffInDays(selectedDate, baseDate) : null;

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
  }, [deltaOutMin, baseDate, selectedDate, dayIndex, minuteOk, clockValue, computeInstanteFromDayTime]);

  const insertInstante = (inst: number) => {
    const current = parseInstantesLoose(value);
    const next = Array.from(new Set([...current, inst])).sort((a, b) => a - b);
    onChange(formatInstantesCanonical(next));

    setLastAdded(inst);
    setFlash(true);
    setTimeout(() => setFlash(false), 450);
  };

  // Calendar click1 sets base, click2 sets target (same-day allowed by clicking same date twice)
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
  }, [clockValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const calendarButtonText = (() => {
    if (!range?.from) return 'Selecciona fecha base (Día 0)';
    if (!range?.to) return `Base: ${range.from.toLocaleDateString()} · Selecciona fecha objetivo`;
    return `Base: ${range.from.toLocaleDateString()} → ${range.to.toLocaleDateString()}`;
  })();

  const timeButtonText = `${pad2(clockValue.hour())}:${pad2(clockValue.minute())}`;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">
          Instantes
        </Label>
        <Input
          className="h-8 text-xs w-full"
          value={value}
          onChange={e => onChange(e.target.value)}
          onPaste={onPasteCanonicalize}
          placeholder="0;10;20"
        />

        <div className="text-[11px] text-muted-foreground">
          <span className={flash ? 'text-foreground' : undefined}>
            Último añadido: {lastAdded ?? '—'}
          </span>
        </div>
      </div>

      <div className="border border-muted rounded-md p-2 space-y-2">
        <div className="text-[11px] text-muted-foreground">
          Flujo: base → objetivo → hora/min (auto inserta) · Δ={deltaOutMin > 0 ? deltaOutMin : '??'} min ·{' '}
          {instPerDay ? `${instPerDay} inst/día` : 'inst/día ?'}
        </div>

        {/* Step 1-2: calendar */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Día (base → objetivo)</Label>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-xs w-full justify-start">
                {calendarButtonText}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0">
              <Calendar mode="range" selected={range} onDayClick={onDayClick} initialFocus />

              <div className="p-2 border-t flex gap-2">
                <Button type="button" variant="outline" className="h-8 text-xs flex-1" onClick={() => setRange(undefined)}>
                  Reset
                </Button>
                <Button type="button" variant="outline" className="h-8 text-xs flex-1" onClick={() => setCalendarOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Step 3-4: MUI clock */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Hora (TimeClock)</Label>

          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 text-xs w-full justify-start"
                disabled={!range?.from || !range?.to || deltaOutMin <= 0}
              >
                {timeButtonText}
              </Button>
            </PopoverTrigger>

            {/* give it a bounded size so it doesn't feel huge */}
            <PopoverContent className="p-2 w-[320px]">
              <div style={{ minHeight: 300 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimeClock
                    value={clockValue}
                    onChange={(newValue) => {
                      if (!newValue) return;

                      // snap to deltaOutMin step
                      let m = newValue.minute();
                      if (minutesStep > 1) {
                        m = Math.round(m / minutesStep) * minutesStep;
                        if (m >= 60) m = 60 - minutesStep;
                      }

                      setClockValue(newValue.minute(m).second(0).millisecond(0));
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
      </div>
    </div>
  );
}
