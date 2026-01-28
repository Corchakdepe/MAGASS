import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {MapsAndGraphsFilterControls} from "@/components/controls/FilterControls/MapsAndGraphsFilterControls";
import {useLanguage} from "@/contexts/LanguageContext";
import {dateDiffInDays} from "@/lib/analysis/filters";
import type {MapsAnalysisState, MapsAnalysisActions} from "../../types/mapsAnalysis";

interface FilterTabProps {
  state: MapsAnalysisState;
  actions: MapsAnalysisActions;
}

export function FilterTab({state, actions}: FilterTabProps) {
  const {t} = useLanguage();

  return (
    <CardContent className="space-y-4">
      <div>
        <div className="text-xs font-semibold text-text-primary">{t('filter')}</div>
        <div className="text-[11px] text-text-secondary">
          {t('restrictStationsByValueAndDayRange')}
        </div>
      </div>

      <MapsAndGraphsFilterControls
        useFilterForMaps={state.useFilterForMaps}
        setUseFilterForMaps={actions.setUseFilterForMaps as React.Dispatch<React.SetStateAction<boolean>>}
        filterKind={state.filterKind}
        setFilterKind={actions.setFilterKind as any}
        filterState={state.filterState}
        setFilterState={actions.setFilterState as any}
        daysRange={state.daysRange}
        setDaysRange={actions.setDaysRange as any}
        dateDiffInDays={dateDiffInDays}
      />
    </CardContent>
  );
}
