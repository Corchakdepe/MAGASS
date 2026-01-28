"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";
import {FILTER_OPERATORS} from "../utils/filterHelpers";
import type {FilterOperator, UnifiedFilterState} from "../types/filterControls";

interface OperatorValueInputsProps {
  filterState: UnifiedFilterState;
  onChange: (updates: Partial<UnifiedFilterState>) => void;
}

export function OperatorValueInputs({filterState, onChange}: OperatorValueInputsProps) {
  const {t} = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('operator')}
        </Label>
        <Select
          value={filterState.operator}
          onValueChange={(operator) => onChange({operator})}
        >
          <SelectTrigger className="h-9 text-xs rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-surface-3 bg-surface-1/95 backdrop-blur-md">
            {FILTER_OPERATORS.map((op) => (
              <SelectItem key={op} value={op} className="text-xs">
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-text-secondary">
          {t('value')}
        </Label>
        <Input
          type="text"
          className="h-9 text-xs rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20"
          value={filterState.value}
          onChange={(e) => onChange({value: e.target.value})}
          placeholder="65"
        />
      </div>
    </div>
  );
}
