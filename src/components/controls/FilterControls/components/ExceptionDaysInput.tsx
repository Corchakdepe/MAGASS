"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useLanguage} from "@/contexts/LanguageContext";

interface ExceptionDaysInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExceptionDaysInput({value, onChange}: ExceptionDaysInputProps) {
  const {t} = useLanguage();

  const displayText = value
    ? `${t('upTo')} ${value} ${t('days')}`
    : t('noExceptions');

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-medium text-text-secondary">
        {t('exceptionDays')}
      </Label>
      <div className="p-3 rounded-md bg-surface-0/60 border border-surface-3">
        <div className="text-xs text-text-primary mb-2">{displayText}</div>
        <div className="space-y-1">
          <Label className="text-[10px] text-text-secondary">
            {t('maxFailDays')}
          </Label>
          <Input
            type="number"
            min="0"
            className="h-8 text-xs rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
      <p className="text-[10px] text-text-tertiary">
        {t('allowStationsToFailOnXDays')}
      </p>
    </div>
  );
}
