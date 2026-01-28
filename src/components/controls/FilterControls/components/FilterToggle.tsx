"use client";

import * as React from "react";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";

interface FilterToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function FilterToggle({enabled, onToggle}: FilterToggleProps) {
  const {t} = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="use-filter-maps"
        checked={enabled}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className={[
          "border-surface-3",
          "data-[state=checked]:border-accent/40",
          "data-[state=checked]:bg-accent",
          "data-[state=checked]:text-text-inverted",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent/25",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
        ].join(" ")}
      />
      <Label
        htmlFor="use-filter-maps"
        className="text-xs text-text-primary cursor-pointer select-none"
      >
        {t('enableFiltering')}
      </Label>
    </div>
  );
}
