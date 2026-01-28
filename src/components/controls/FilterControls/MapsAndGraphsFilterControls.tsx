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
    <div className="space-y-4">
      <FilterToggle enabled={useFilterForMaps} onToggle={setUseFilterForMaps} />

      {useFilterForMaps && (
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold text-text-primary">
              {t('stationFiltering')}
            </div>
            <div className="text-[11px] text-text-secondary">
              {t('restrictResultsByValueAndRange')}
            </div>
          </div>

          <FilterTypeSelect value={filterKind} onChange={setFilterKind} />

          <div className="h-px bg-surface-3/70" aria-hidden="true" />

          <OperatorValueInputs
            filterState={filterState}
            onChange={updateFilterState}
          />

          <div className="h-px bg-surface-3/70" aria-hidden="true" />

          <DayPercentageSlider
            value={filterState.dayPct}
            onChange={(dayPct) => updateFilterState({dayPct})}
          />

          <div className="h-px bg-surface-3/70" aria-hidden="true" />

          <DaysRangeSelector
            range={daysRange}
            onRangeChange={setDaysRange}
            onFilterStateUpdate={updateFilterState}
            dateDiffInDays={dateDiffInDays}
          />

          <div className="h-px bg-surface-3/70" aria-hidden="true" />

          <ExceptionDaysInput
            value={filterState.allowedFailDays}
            onChange={(allowedFailDays) => updateFilterState({allowedFailDays})}
          />
        </div>
      )}
    </div>
  );
}
