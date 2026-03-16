"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";
import {Settings2} from "lucide-react";
import type {FilterKind} from "../types/filterControls";

interface FilterTypeSelectProps {
  value: FilterKind;
  onChange: (value: FilterKind) => void;
}

const FILTER_OPTIONS: {value: FilterKind; labelKey: string; description: string}[] = [
  {value: "EstValor", labelKey: "stationValueDay", description: "Filter by daily station values"},
  {value: "EstValorDias", labelKey: "stationValueMonth", description: "Filter by monthly station values"},
  {value: "Horas", labelKey: "hours", description: "Filter by time-based criteria"},
  {value: "Porcentaje", labelKey: "percentage", description: "Filter by percentage thresholds"},
];

export function FilterTypeSelect({value, onChange}: FilterTypeSelectProps) {
  const {t} = useLanguage();
  const selectedOption = FILTER_OPTIONS.find(opt => opt.value === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Settings2 className="h-3.5 w-3.5 text-accent" />
        <Label className="text-xs font-medium text-text-primary">
          {t('filterType')}
        </Label>
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-surface-3 bg-surface-1 shadow-lg">
          {FILTER_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-sm py-2 cursor-pointer"
            >
              <div className="flex flex-col">
                <span>{t(option.labelKey)}</span>
                <span className="text-[9px] text-text-tertiary">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedOption && (
        <p className="text-[10px] text-text-secondary italic border-l-2 border-accent/30 pl-2">
          {selectedOption.description}
        </p>
      )}
    </div>
  );
}