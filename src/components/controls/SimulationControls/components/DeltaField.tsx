"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  delta: number;
  setDelta: (v: number) => void;
};

export function DeltaField({ delta, setDelta }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-1">
      <Label htmlFor="delta" className="text-[11px] text-text-secondary">
        {t("deltaMinutes")}
      </Label>
      <Input
        id="delta"
        type="number"
        value={delta}
        onChange={(e) => setDelta(Number(e.target.value) || 0)}
        className="h-9 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
      />
    </div>
  );
}
