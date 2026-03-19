import type {DateRange} from "react-day-picker";
import type {FilterKind, UnifiedFilterState} from "@/types/analysis";
import type {GraficaKey} from "@/lib/analysis/graphs/types";

export interface GraphAnalysisPanelProps {
  runId?: string;
}

export interface GraphAnalysisState {
  // Matrix
  seleccionAgreg: string;

  // Selected graphs
  selectedCharts: GraficaKey[];

  // Unified filter
  filterKind: FilterKind;
  filterState: UnifiedFilterState;
  useFilter: boolean;
  daysRange?: DateRange;

  // Advanced controls
  advancedUser: boolean;
  deltaMode: "media" | "acumulada";
  deltaValueTxt: string;
  advancedEntrada: string;
  advancedSalida: string;

  // Graph params
  barStations: string;
  barDays: string;
  barDaysRange?: DateRange;
  dayDays: string;
  dayDaysRange?: DateRange;
  dayMode: "M" | "A";
  dayFreq: boolean;
  lineStations: string;
  lineDays: string;
  lineDaysRange?: DateRange;
  matsDelta: string;
  matsStations1: string;
  matsStations2: string;
  matsMode: "M" | "A";
}

export interface GraphAnalysisActions {
  setSeleccionAgreg: (value: string) => void;
  setSelectedCharts: (value: GraficaKey[]) => void;
  setFilterKind: (value: FilterKind) => void;
  setFilterState: (value: UnifiedFilterState) => void;
  setUseFilter: (value: boolean) => void;
  setDaysRange: (value?: DateRange) => void;
  setAdvancedUser: (value: boolean) => void;
  setDeltaMode: (value: "media" | "acumulada") => void;
  setDeltaValueTxt: (value: string) => void;
  setAdvancedEntrada: (value: string) => void;
  setAdvancedSalida: (value: string) => void;
  setBarStations: (value: string) => void;
  setBarDays: (value: string) => void;
  setBarDaysRange: (value?: DateRange) => void;
  setDayDays: (value: string) => void;
  setDayDaysRange: (value?: DateRange) => void;
  setDayMode: (value: "M" | "A") => void;
  setDayFreq: (value: boolean) => void;
  setLineStations: (value: string) => void;
  setLineDays: (value: string) => void;
  setLineDaysRange: (value?: DateRange) => void;
  setMatsDelta: (value: string) => void;
  setMatsStations1: (value: string) => void;
  setMatsStations2: (value: string) => void;
  setMatsMode: (value: "M" | "A") => void;
}
