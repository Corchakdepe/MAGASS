import * as React from "react";
import {CardContent} from "@/components/ui/card";
import { GraphsSelectorCard } from "@/components/controls/GraphsControls/GraphsSelectorCard";
import {GRAFICAS} from "@/lib/analysis/graphs/defs";
import {encodeRangeAsDayList} from "../../utils/dateHelpers";
import type {GraphAnalysisState, GraphAnalysisActions} from "../../types/graphAnalysis";

interface GraphsTabProps {
  state: GraphAnalysisState;
  actions: GraphAnalysisActions;
}

export function GraphsTab({state, actions}: GraphsTabProps) {
  return (
    <CardContent className="space-y-4">
      <GraphsSelectorCard
        GRAFICAS={GRAFICAS}
        selectedCharts={state.selectedCharts}
        setSelectedCharts={actions.setSelectedCharts}
        useFilter={state.useFilter}
        barStations={state.barStations}
        setBarStations={actions.setBarStations}
        barDays={state.barDays}
        setBarDays={actions.setBarDays}
        barDaysRange={state.barDaysRange}
        setBarDaysRange={actions.setBarDaysRange}
        dayDays={state.dayDays}
        setDayDays={actions.setDayDays}
        dayDaysRange={state.dayDaysRange}
        setDayDaysRange={actions.setDayDaysRange}
        dayMode={state.dayMode}
        setDayMode={actions.setDayMode}
        dayFreq={state.dayFreq}
        setDayFreq={actions.setDayFreq}
        lineStations={state.lineStations}
        setLineStations={actions.setLineStations}
        lineDays={state.lineDays}
        setLineDays={actions.setLineDays}
        lineDaysRange={state.lineDaysRange}
        setLineDaysRange={actions.setLineDaysRange}
        matsDelta={state.matsDelta}
        setMatsDelta={actions.setMatsDelta}
        matsStations1={state.matsStations1}
        setMatsStations1={actions.setMatsStations1}
        matsStations2={state.matsStations2}
        setMatsStations2={actions.setMatsStations2}
        matsMode={state.matsMode}
        setMatsMode={actions.setMatsMode}
        encodeRangeAsDayList={encodeRangeAsDayList}
      />
    </CardContent>
  );
}
