"use client";

import * as React from "react";
import {Button} from "@/components/ui/button";
import {useLanguage} from "@/contexts/LanguageContext";
import type {Step, ClockView} from "../types/instantes";

interface NavigationButtonsProps {
  step: Step;
  currentValue: string;
  onBack: () => void;
  onCancel: () => void;
}

export function NavigationButtons({
  step,
  currentValue,
  onBack,
  onCancel,
}: NavigationButtonsProps) {
  const {t} = useLanguage();

  return (
    <div className="flex flex-col gap-2 p-4 pt-2 border-t border-surface-3">
      <div className="flex gap-2">
        {step !== "date" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex-1 text-xs h-8"
          >
            {t('back')}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs h-8"
        >
          {t('cancel')}
        </Button>
      </div>
      <div className="text-[10px] text-text-tertiary text-center">
        {t('currentValue')}: {currentValue || "0"}
      </div>
    </div>
  );
}
