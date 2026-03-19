import * as React from "react";
import {CardContent} from "@/components/ui/card";
import {MapsAndGraphsFilterControls} from "@/components/controls/FilterControls/MapsAndGraphsFilterControls";
import {dateDiffInDays} from "../../utils/dateHelpers";
import type {GraphAnalysisState, GraphAnalysisActions} from "../../types/graphAnalysis";

interface FilterTabProps {
  state: GraphAnalysisState;
  actions: GraphAnalysisActions;
}

export function FilterTab({state, actions}: FilterTabProps) {
  return (
    <CardContent className="space-y-4">
      <MapsAndGraphsFilterControls
        useFilterForMaps={state.useFilter}
        setUseFilterForMaps={actions.setUseFilter as React.Dispatch<React.SetStateAction<boolean>>}
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
