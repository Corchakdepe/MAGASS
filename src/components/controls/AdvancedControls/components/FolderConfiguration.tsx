"use client";

import * as React from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";
import type {FolderConfigurationProps} from "../types/advancedControls";

export function FolderConfiguration({
  advancedEntrada,
  setAdvancedEntrada,
  advancedSalida,
  setAdvancedSalida,
}: FolderConfigurationProps) {
  const {t} = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('advancedInput')}
        </Label>
        <Input
          type="text"
          className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
          value={advancedEntrada}
          onChange={(e) => setAdvancedEntrada(e.target.value)}
          placeholder={t('inputFolderPlaceholder')}
          aria-label={t('advancedInput')}
        />
        <p className="text-[10px] text-text-tertiary">
          {t('inputFolderHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('advancedOutput')}
        </Label>
        <Input
          type="text"
          className="h-9 text-xs w-full rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:border-accent"
          value={advancedSalida}
          onChange={(e) => setAdvancedSalida(e.target.value)}
          placeholder={t('outputFolderPlaceholder')}
          aria-label={t('advancedOutput')}
        />
        <p className="text-[10px] text-text-tertiary">
          {t('outputFolderHint')}
        </p>
      </div>
    </div>
  );
}
