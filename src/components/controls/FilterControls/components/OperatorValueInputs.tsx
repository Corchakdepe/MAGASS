"use client";

import * as React from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useLanguage} from "@/contexts/LanguageContext";
import {FILTER_OPERATORS} from "../utils/filterHelpers";
import {Filter, ChevronDown} from "lucide-react";
import type {FilterOperator, UnifiedFilterState} from "../types/filterControls";

interface OperatorValueInputsProps {
  filterState: UnifiedFilterState;
  onChange: (updates: Partial<UnifiedFilterState>) => void;
}

export function OperatorValueInputs({filterState, onChange}: OperatorValueInputsProps) {
  const {t} = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5 text-accent" />
        <Label className="text-xs font-medium text-text-primary">
          {t('conditions')}
        </Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[9px] uppercase tracking-wider text-text-tertiary font-medium">
            {t('operator')}
          </Label>
          <Select
            value={filterState.operator}
            onValueChange={(operator) => onChange({operator})}
          >
            <SelectTrigger className="h-9 text-sm rounded-md border-surface-3 bg-surface-1 focus:ring-2 focus:ring-accent/20">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent className="border-surface-3 bg-surface-1 shadow-lg">
              {FILTER_OPERATORS.map((op) => (
                <SelectItem key={op} value={op} className="text-sm cursor-pointer">
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[9px] uppercase tracking-wider text-text-tertiary font-medium">
            {t('value')}
          </Label>
          <Input
            type="text"
            className="h-9 text-sm rounded-md border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/20"
            value={filterState.value}
            onChange={(e) => onChange({value: e.target.value})}
            placeholder="65"
          />
        </div>
      </div>

      {/* Preview of current condition */}
      {filterState.operator && filterState.value && (
        <div className="mt-2 p-2 bg-surface-2/30 rounded-md border border-surface-3/50">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-text-tertiary">{t('currentFilter')}:</span>
            <span className="font-mono text-accent bg-accent/5 px-1.5 py-0.5 rounded">
              {filterState.operator} {filterState.value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}