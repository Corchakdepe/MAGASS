"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";
import type {FilterKind} from "../types/filterControls";

interface FilterTypeSelectProps {
  value: FilterKind;
  onChange: (value: FilterKind) => void;
}

const FILTER_OPTIONS: {value: FilterKind; labelKey: string}[] = [
  {value: "EstValor", labelKey: "stationValueDay"},
  {value: "EstValorDias", labelKey: "stationValueMonth"},
  {value: "Horas", labelKey: "hours"},
  {value: "Porcentaje", labelKey: "percentage"},
];

export function FilterTypeSelect({value, onChange}: FilterTypeSelectProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-text-secondary">
        {t('filterType')}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
          {FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
