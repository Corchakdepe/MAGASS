'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type FilterState = {
  operator: string;   // >=, <=, >, <
  value: string;      // threshold
  stationsPct: string; // % stations
  days: string;       // all or 0;1;2
  minHours: string;   // hours
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  compact?: boolean;
};

export function buildFilterString(f: FilterState, nullChar = '_'): string {
  const v = f.value.trim();
  const p = f.stationsPct.trim();
  const d = f.days.trim() || 'all';
  const h = f.minHours.trim();
  if (!v || !p || !h) return nullChar;
  return `${f.operator}${v};${p};${d};${h}`;
}

export default function FilterPanel({ value, onChange, compact }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  const wrapperClass = compact
    ? 'space-y-1 text-xs'
    : 'space-y-2';

  return (
    <div className={wrapperClass}>
      <Label className={compact ? 'text-xs' : ''}>Filtro por valor</Label>
      <div className="grid grid-cols-4 gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Operador</Label>
          <Select
            value={value.operator}
            onValueChange={operator => set({ operator })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=">=">{'>='}</SelectItem>
              <SelectItem value="<=">{'<='}</SelectItem>
              <SelectItem value=">">{'>'}</SelectItem>
              <SelectItem value="<">{'<'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor</Label>
          <Input
            className="h-8 text-xs"
            value={value.value}
            onChange={e => set({ value: e.target.value })}
            placeholder="65"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">% est.</Label>
          <Input
            className="h-8 text-xs"
            value={value.stationsPct}
            onChange={e => set({ stationsPct: e.target.value })}
            placeholder="20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Días / h mín.</Label>
          <div className="flex gap-1">
            <Input
              className="h-8 text-xs w-1/2"
              value={value.days}
              onChange={e => set({ days: e.target.value })}
              placeholder="all"
            />
            <Input
              className="h-8 text-xs w-1/2"
              value={value.minHours}
              onChange={e => set({ minHours: e.target.value })}
              placeholder="5h"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
