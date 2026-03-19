'use client';

import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeClock } from '@mui/x-date-pickers/TimeClock';
import { useLanguage } from '@/contexts/LanguageContext';

// Import MUI locales
import 'dayjs/locale/es';
import 'dayjs/locale/pt';
import 'dayjs/locale/en';

type MuiTimeClockProps = {
  hour: number;                 // 0..23
  minute: number;               // 0..59
  minuteStep: number;           // e.g. deltaOutMin
  onChange: (next: { hour: number; minute: number }) => void;
};

export function MuiTimeClock({ hour, minute, minuteStep, onChange }: MuiTimeClockProps) {
  const { language } = useLanguage();

  // Map our language codes to dayjs locale codes
  const localeMap: Record<string, string> = {
    en: 'en',
    es: 'es',
    pt: 'pt',
  };

  const dayjsLocale = localeMap[language] || 'en';

  const value: Dayjs = dayjs().hour(hour).minute(minute).second(0).millisecond(0).locale(dayjsLocale);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={dayjsLocale}>
      <TimeClock
        value={value}
        onChange={(newValue) => {
          if (!newValue) return;

          const h = newValue.hour();
          let m = newValue.minute();

          // force minutes to align to your deltaOutMin step
          if (minuteStep > 1) {
            m = Math.round(m / minuteStep) * minuteStep;
            if (m >= 60) m = 60 - minuteStep;
          }

          onChange({ hour: h, minute: m });
        }}
        views={['hours', 'minutes']}
        minutesStep={Math.max(1, minuteStep)}
      />
    </LocalizationProvider>
  );
}
