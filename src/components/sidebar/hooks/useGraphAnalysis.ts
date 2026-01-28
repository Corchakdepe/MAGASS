import * as React from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import {analyzeGraphs} from "@/lib/analysis/graphs/api";
import type {GraphAnalysisState} from "../types/graphAnalysis";

export function useGraphAnalysis(runId: string | undefined, state: GraphAnalysisState) {
  const {t} = useLanguage();
  const [apiBusy, setApiBusy] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const deltaMediaTxt =
    state.advancedUser && state.deltaMode === "media" ? state.deltaValueTxt : "";
  const deltaAcumTxt =
    state.advancedUser && state.deltaMode === "acumulada" ? state.deltaValueTxt : "";

  const handleAnalyze = async () => {
    if (apiBusy || state.selectedCharts.length === 0) return;

    if (!runId) {
      setApiError(t('selectSimulation'));
      return;
    }

    setApiBusy(true);
    setApiError(null);

    try {
      await analyzeGraphs({
        runId,
        seleccionAgreg: state.seleccionAgreg,
        selectedCharts: state.selectedCharts,
        deltaMediaTxt,
        deltaAcumTxt,
        useFilter: state.useFilter,
        filterKind: state.filterKind,
        filterState: state.filterState,
        barStations: state.barStations,
        barDays: state.barDays,
        dayDays: state.dayDays,
        dayMode: state.dayMode,
        dayFreq: state.dayFreq,
        lineStations: state.lineStations,
        lineDays: state.lineDays,
        matsDelta: state.matsDelta,
        matsStations1: state.matsStations1,
        matsStations2: state.matsStations2,
        matsMode: state.matsMode,
      });
    } catch (e: any) {
      setApiError(e?.message ?? t('unexpectedError'));
    } finally {
      setApiBusy(false);
    }
  };

  return {
    apiBusy,
    apiError,
    handleAnalyze,
  };
}
