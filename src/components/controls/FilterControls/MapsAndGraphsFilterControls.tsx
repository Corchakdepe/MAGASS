"use client";

import * as React from "react";
import {FilterToggle} from "./components/FilterToggle";
import {FilterTypeSelect} from "./components/FilterTypeSelect";
import {OperatorValueInputs} from "./components/OperatorValueInputs";
import {DayPercentageSlider} from "./components/DayPercentageSlider";
import {DaysRangeSelector} from "./components/DaysRangeSelector";
import {ExceptionDaysInput} from "./components/ExceptionDaysInput";
import {useLanguage} from "@/contexts/LanguageContext";
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
    <div className="space-y-3">
      <FilterToggle enabled={useFilterForMaps} onToggle={setUseFilterForMaps} />

      {useFilterForMaps && (
        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary">
              {t('stationFiltering')}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-surface-3/50">
            <FilterTypeSelect value={filterKind} onChange={setFilterKind} />

            <OperatorValueInputs
              filterState={filterState}
              onChange={updateFilterState}
            />

            <DayPercentageSlider
              value={filterState.dayPct}
              onChange={(dayPct) => updateFilterState({dayPct})}
            />

            <DaysRangeSelector
              range={daysRange}
              onRangeChange={setDaysRange}
              onFilterStateUpdate={updateFilterState}
              dateDiffInDays={dateDiffInDays}
            />

            <ExceptionDaysInput
              value={filterState.allowedFailDays}
              onChange={(allowedFailDays) => updateFilterState({allowedFailDays})}
            />
          </div>
        </div>
      )}
    </div>
  );
}
