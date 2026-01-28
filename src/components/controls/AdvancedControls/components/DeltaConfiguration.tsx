"use client";

import * as React from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";
import type {DeltaConfigurationProps, DeltaMode} from "../types/advancedControls";

export function DeltaConfiguration({
  deltaMode,
  setDeltaMode,
  deltaValueTxt,
  setDeltaValueTxt,
}: DeltaConfigurationProps) {
  const {t} = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('delta')}
        </Label>
        <Select
          value={deltaMode}
          onValueChange={(v) => setDeltaMode(v as DeltaMode)}
        >
          <SelectTrigger className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20 focus:border-accent">
            <SelectValue placeholder={t('selectDelta')} />
          </SelectTrigger>
          <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
            <SelectItem value="media" className="text-xs">
              {t('deltaAverage')}
            </SelectItem>
            <SelectItem value="acumulada" className="text-xs">
              {t('deltaCumulative')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('value')}
        </Label>
        <Input
          type="text"
          className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
          value={deltaValueTxt}
          onChange={(e) => setDeltaValueTxt(e.target.value)}
          placeholder="4, 60, 1440…"
          aria-label={t('deltaValue')}
        />
        <p className="text-[10px] text-text-tertiary">
          {t('deltaValueHint')}
        </p>
      </div>
    </div>
  );
}
