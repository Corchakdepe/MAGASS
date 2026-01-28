"use client";

import * as React from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";
import type {AdvancedToggleProps} from "../types/advancedControls";

export function AdvancedToggle({advancedUser, setAdvancedUser}: AdvancedToggleProps) {
  const {t} = useLanguage();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Checkbox
          id="advanced-user"
          checked={advancedUser}
          onCheckedChange={(v) => setAdvancedUser(Boolean(v))}
          className="
            border-surface-3
            data-[state=checked]:border-accent
            data-[state=checked]:bg-accent
            data-[state=checked]:text-text-inverted
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-accent/30
            focus-visible:ring-offset-2
            focus-visible:ring-offset-surface-0
          "
        />
        <Label
          htmlFor="advanced-user"
          className="text-xs text-text-primary select-none cursor-pointer"
        >
          {t('advancedUser')}
        </Label>
      </div>

      <span className="text-[11px] text-text-secondary shrink-0">
        {t('advancedSettings')}
      </span>
    </div>
  );
}
