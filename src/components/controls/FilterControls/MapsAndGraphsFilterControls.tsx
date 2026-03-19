"use client";

import * as React from "react";
import {FilterToggle} from "./components/FilterToggle";
import {FilterTypeSelect} from "./components/FilterTypeSelect";
import {OperatorValueInputs} from "./components/OperatorValueInputs";
import {DayPercentageSlider} from "./components/DayPercentageSlider";
import {DaysRangeSelector} from "./components/DaysRangeSelector";
import {ExceptionDaysInput} from "./components/ExceptionDaysInput";
import {useLanguage} from "@/contexts/LanguageContext";
import {Filter, Calendar, Percent, AlertCircle, Settings2} from "lucide-react";
import type {MapsAndGraphsFilterControlsProps, UnifiedFilterState} from "./types/filterControls";

export type {
  FilterOperator,
  FilterKind,
  UnifiedFilterState,
  MapsAndGraphsFilterControlsProps,
} from "./types/filterControls";

export function MapsAndGraphsFilterControls({
  useFilterForMaps,
  setUseFilterForMaps,
  filterKind,
  setFilterKind,
  filterState,
  setFilterState,
  daysRange,
  setDaysRange,
  dateDiffInDays,
}: MapsAndGraphsFilterControlsProps) {
  const {t} = useLanguage();

  const updateFilterState = (updates: Partial<UnifiedFilterState>) => {
    setFilterState((prev) => ({...prev, ...updates}));
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle with improved styling */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent rounded-lg" />
        <div className="relative flex items-center justify-between p-3 bg-surface-2/30 rounded-lg border border-surface-3/50">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-1.5 rounded-md transition-colors duration-200",
              useFilterForMaps
                ? "bg-accent/10 border border-accent/20"
                : "bg-surface-2 border border-surface-3"
            )}>
              <Filter className={cn(
                "h-4 w-4",
                useFilterForMaps ? "text-accent" : "text-text-tertiary"
              )} />
            </div>
            <div>
              <span className="text-sm font-medium text-text-primary block">
                {t('filterData')}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {useFilterForMaps ? t('filterActive') : t('filterInactive')}
              </span>
            </div>
          </div>
          <FilterToggle enabled={useFilterForMaps} onToggle={setUseFilterForMaps} />
        </div>
      </div>

      {useFilterForMaps && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header with decorative elements */}
          <div className="relative px-1 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-1 bg-accent rounded-full" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                {t('stationFiltering')}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-accent/30 to-transparent" />
            </div>
          </div>

          {/* Filter configuration cards */}
          <div className="space-y-3">
            {/* Filter Type Card */}
            <div className="bg-surface-2/20 rounded-lg border border-surface-3/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-2/30 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-text-primary">{t('filterType')}</span>
                </div>
              </div>
              <div className="p-3">
                <FilterTypeSelect value={filterKind} onChange={setFilterKind} />
              </div>
            </div>

            {/* Operator & Values Card */}
            <div className="bg-surface-2/20 rounded-lg border border-surface-3/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-2/30 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-text-primary">{t('conditions')}</span>
                </div>
              </div>
              <div className="p-3">
                <OperatorValueInputs
                  filterState={filterState}
                  onChange={updateFilterState}
                />
              </div>
            </div>

            {/* Day Percentage Card */}
            <div className="bg-surface-2/20 rounded-lg border border-surface-3/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-2/30 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-text-primary">{t('coverageThreshold')}</span>
                </div>
              </div>
              <div className="p-3">
                <DayPercentageSlider
                  value={filterState.dayPct}
                  onChange={(dayPct) => updateFilterState({dayPct})}
                />
              </div>
            </div>

            {/* Days Range Card */}
            <div className="bg-surface-2/20 rounded-lg border border-surface-3/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-2/30 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-text-primary">{t('dateRange')}</span>
                </div>
              </div>
              <div className="p-3">
                <DaysRangeSelector
                  range={daysRange}
                  onRangeChange={setDaysRange}
                  onFilterStateUpdate={updateFilterState}
                  dateDiffInDays={dateDiffInDays}
                />
              </div>
            </div>

            {/* Exception Days Card */}
            <div className="bg-surface-2/20 rounded-lg border border-surface-3/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-2/30 border-b border-surface-3/30">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                  <span className="text-xs font-medium text-text-primary">{t('exceptions')}</span>
                </div>
              </div>
              <div className="p-3">
                <ExceptionDaysInput
                  value={filterState.allowedFailDays}
                  onChange={(allowedFailDays) => updateFilterState({allowedFailDays})}
                />
              </div>
            </div>
          </div>

          {/* Footer with quick summary */}
          <div className="mt-4 pt-3 border-t border-surface-3/30">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-tertiary">{t('filterSummary')}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-accent/5 rounded-full text-accent border border-accent/10">
                  {filterKind}
                </span>
                {filterState.operator && (
                  <span className="px-2 py-1 bg-surface-2 rounded-full text-text-secondary border border-surface-3">
                    {filterState.operator} {filterState.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}