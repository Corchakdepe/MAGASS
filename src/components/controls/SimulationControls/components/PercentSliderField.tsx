"use client";

import React from "react";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: string;
  value: number;
  setValue: (v: number) => void;
};

export function PercentSliderField({ id, label, value, setValue }: Props) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] text-text-secondary">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value) || 0)}
          className="flex-1 accent-accent"
        />
        <span className="w-12 text-right text-xs font-medium text-text-primary">
          {value}%
        </span>
      </div>
    </div>
  );
}
