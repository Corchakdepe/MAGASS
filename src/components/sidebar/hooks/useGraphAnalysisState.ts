import * as React from "react";
import type {DateRange} from "react-day-picker";
import {usePersistentState} from "@/hooks/usePersistentState";
import type {FilterKind, UnifiedFilterState} from "@/types/analysis";
import type {GraficaKey} from "@/lib/analysis/graphs/types";
import type {GraphAnalysisState, GraphAnalysisActions} from "../types/graphAnalysis";

// Helper to convert simple setter to React.Dispatch<SetStateAction<T>>
function wrapSetter<T>(setter: (value: T) => void): React.Dispatch<React.SetStateAction<T>> {
  return (value: React.SetStateAction<T>) => {
    if (typeof value === 'function') {
      // Can't handle functional updates without access to current state
      // This is a limitation of our simple wrapper approach
      console.warn('Functional state updates not supported in wrapped setters');
      return;
    }
    setter(value);
  };
}

export function useGraphAnalysisState(): [GraphAnalysisState, GraphAnalysisActions, boolean] {
  // Matrix
  const [seleccionAgreg, setSeleccionAgreg, seleccionHydrated] =
    usePersistentState("graphs_seleccionAgreg", "");

  // Selected graphs
  const [selectedCharts, setSelectedCharts, chartsHydrated] =
    usePersistentState<GraficaKey[]>("graphs_selectedCharts", []);

  // Unified filter
  const [filterKind, setFilterKind, filterKindHydrated] =
    usePersistentState<FilterKind>("graphs_filterKind", "EstValorDias");

  const [filterState, setFilterState, filterStateHydrated] =
    usePersistentState<UnifiedFilterState>("graphs_filterState", {
      operator: ">=",
      value: "65",
      dayPct: "0",
      days: "all",
      allowedFailDays: "5",
      stationsPct: "0",
      stationsList: "",
    });

  const [useFilter, setUseFilter, useFilterHydrated] =
    usePersistentState("graphs_useFilter", false);

  const [daysRange, setDaysRange] = React.useState<DateRange | undefined>();

  // AdvancedControls (delta + folders)
  const [advancedUser, setAdvancedUser, advancedHydrated] =
    usePersistentState("graphs_advancedUser", false);

  const [deltaMode, setDeltaMode, deltaModeHydrated] =
    usePersistentState<"media" | "acumulada">("graphs_deltaMode", "media");

  const [deltaValueTxt, setDeltaValueTxt, deltaValueHydrated] =
    usePersistentState("graphs_deltaValueTxt", "");

  const [advancedEntrada, setAdvancedEntrada, advEntradaHydrated] =
    usePersistentState("graphs_advancedEntrada", "");

  const [advancedSalida, setAdvancedSalida, advSalidaHydrated] =
    usePersistentState("graphs_advancedSalida", "");

  // Graph params
  const [barStations, setBarStations, barStationsHydrated] =
    usePersistentState("graphs_barStations", "87;212");

  const [barDays, setBarDays, barDaysHydrated] =
    usePersistentState("graphs_barDays", "all");

  const [barDaysRange, setBarDaysRange] = React.useState<DateRange | undefined>();

  const [dayDays, setDayDays, dayDaysHydrated] =
    usePersistentState("graphs_dayDays", "all");

  const [dayDaysRange, setDayDaysRange] = React.useState<DateRange | undefined>();

  const [dayMode, setDayMode, dayModeHydrated] =
    usePersistentState<"M" | "A">("graphs_dayMode", "M");

  const [dayFreq, setDayFreq, dayFreqHydrated] =
    usePersistentState("graphs_dayFreq", true);

  const [lineStations, setLineStations, lineStationsHydrated] =
    usePersistentState("graphs_lineStations", "87;212");

  const [lineDays, setLineDays, lineDaysHydrated] =
    usePersistentState("graphs_lineDays", "all");

  const [lineDaysRange, setLineDaysRange] = React.useState<DateRange | undefined>();

  const [matsDelta, setMatsDelta, matsDeltaHydrated] =
    usePersistentState("graphs_matsDelta", "60");

  const [matsStations1, setMatsStations1, matsStations1Hydrated] =
    usePersistentState("graphs_matsStations1", "87;212");

  const [matsStations2, setMatsStations2, matsStations2Hydrated] =
    usePersistentState("graphs_matsStations2", "0;1");

  const [matsMode, setMatsMode, matsModeHydrated] =
    usePersistentState<"M" | "A">("graphs_matsMode", "M");

  const uiHydrated =
    seleccionHydrated &&
    chartsHydrated &&
    filterKindHydrated &&
    filterStateHydrated &&
    useFilterHydrated &&
    advancedHydrated &&
    deltaModeHydrated &&
    deltaValueHydrated &&
    advEntradaHydrated &&
    advSalidaHydrated &&
    barStationsHydrated &&
    barDaysHydrated &&
    dayDaysHydrated &&
    dayModeHydrated &&
    dayFreqHydrated &&
    lineStationsHydrated &&
    lineDaysHydrated &&
    matsDeltaHydrated &&
    matsStations1Hydrated &&
    matsStations2Hydrated &&
    matsModeHydrated;

  const state: GraphAnalysisState = {
    seleccionAgreg,
    selectedCharts,
    filterKind,
    filterState,
    useFilter,
    daysRange,
    advancedUser,
    deltaMode,
    deltaValueTxt,
    advancedEntrada,
    advancedSalida,
    barStations,
    barDays,
    barDaysRange,
    dayDays,
    dayDaysRange,
    dayMode,
    dayFreq,
    lineStations,
    lineDays,
    lineDaysRange,
    matsDelta,
    matsStations1,
    matsStations2,
    matsMode,
  };

  const actions: GraphAnalysisActions = {
    setSeleccionAgreg,
    setSelectedCharts,
    setFilterKind,
    setFilterState,
    setUseFilter,
    setDaysRange,
    setAdvancedUser,
    setDeltaMode,
    setDeltaValueTxt,
    setAdvancedEntrada,
    setAdvancedSalida,
    setBarStations,
    setBarDays,
    setBarDaysRange,
    setDayDays,
    setDayDaysRange,
    setDayMode,
    setDayFreq,
    setLineStations,
    setLineDays,
    setLineDaysRange,
    setMatsDelta,
    setMatsStations1,
    setMatsStations2,
    setMatsMode,
  };

  return [state, actions, uiHydrated];
}
