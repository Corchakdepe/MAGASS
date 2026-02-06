"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  simName: string;
  setSimName: (v: string) => void;
};

export function SimulationNameField({ simName, setSimName }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-1">
      <Label htmlFor="simName" className="text-[11px] text-text-secondary">
        {t("simulationName")}
      </Label>
      <Input
        id="simName"
        type="text"
        value={simName}
        onChange={(e) => setSimName(e.target.value)}
        placeholder={t("simulationNamePlaceholder")}
        className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
      />
    </div>
  );
}
