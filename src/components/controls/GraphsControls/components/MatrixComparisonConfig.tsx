"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";

interface MatrixComparisonConfigProps {
  delta: string;
  onDeltaChange: (value: string) => void;
  mode: "Suma" | "Media";
  onModeChange: (mode: "Suma" | "Media") => void;
  stations1: string;
  onStations1Change: (value: string) => void;
  stations2: string;
  onStations2Change: (value: string) => void;
}

export function MatrixComparisonConfig({
  delta,
  onDeltaChange,
  mode,
  onModeChange,
  stations1,
  onStations1Change,
  stations2,
  onStations2Change,
}: MatrixComparisonConfigProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-3 pt-2 border-t border-surface-3/50">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
            {t('delta')}
          </Label>
          <Input
            type="text"
            className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors"
            value={delta}
            onChange={(e) => onDeltaChange(e.target.value)}
            placeholder="1440"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
            {t('mode')}
          </Label>
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
              <SelectItem value="Suma" className="text-xs">{t('sum')}</SelectItem>
              <SelectItem value="Media" className="text-xs">{t('average')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
            {t('stationsSet1')}
          </Label>
          <Input
            type="text"
            className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors"
            value={stations1}
            onChange={(e) => onStations1Change(e.target.value)}
            placeholder="1;2;3..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-primary">
            {t('stationsSet2')}
          </Label>
          <Input
            type="text"
            className="h-8 text-xs rounded-md border-surface-3 bg-surface-1/50 focus:bg-surface-1 transition-colors"
            value={stations2}
            onChange={(e) => onStations2Change(e.target.value)}
            placeholder="4;5;6..."
          />
        </div>
      </div>
    </div>
  );
}
