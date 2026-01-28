import type {DateRange} from "react-day-picker";
import type {
  MapKey,
  StationsTargetKey,
  DeltaMode,
  FilterKind,
  UnifiedFilterState,
} from "@/types/analysis";

export type QuickGraphKey =
  | "graf_barras_est_med"
  | "graf_barras_est_acum"
  | "graf_linea_comp_est";

export const ALLOWED_GRAPH_MATRIX_IDS = [-1, 0, 1, 9, 10, 11, 12, 13] as const;
export type AllowedGraphMatrixId = (typeof ALLOWED_GRAPH_MATRIX_IDS)[number];

export interface MapsAnalysisPanelProps {
  runId?: string;
  externalStationsMaps?: Record<string, string>;
  onClearExternalStationsMaps?: () => void;
  activeStationsTargetKey?: StationsTargetKey;
  onActiveStationsTargetKeyChange?: (k: StationsTargetKey) => void;
}

export interface MapsAnalysisState {
  // Folders
  entrada: string;
  salida: string;

  // Matrix
  seleccionAgreg: string;

  // Maps
  selectedMaps: MapKey[];
  instantesMaps: Record<string, string>;
  stationsMaps: Record<string, string>;
  labelsMaps: Record<string, boolean>;
  mapUserName: string;

  // Filter
  filterKind: FilterKind;
  filterState: UnifiedFilterState;
  useFilterForMaps: boolean;
  daysRange?: DateRange;

  // Advanced
  advancedUser: boolean;
  deltaMode: DeltaMode;
  deltaValueTxt: string;
  advancedEntrada: string;
  advancedSalida: string;

  // Quick graphs
  circleStationsForGraphs: string;
  quickGraph: QuickGraphKey | null;

  // Delta
  deltaInMin: number;
}

export interface MapsAnalysisActions {
  setEntrada: (value: string) => void;
  setSalida: (value: string) => void;
  setSeleccionAgreg: (value: string) => void;
  setSelectedMaps: (value: MapKey[]) => void;
  setInstantesMaps: (value: Record<string, string>) => void;
  setStationsMaps: (value: Record<string, string>) => void;
  setLabelsMaps: (value: Record<string, boolean>) => void;
  setMapUserName: (value: string) => void;
  setFilterKind: (value: FilterKind) => void;
  setFilterState: (value: UnifiedFilterState) => void;
  setUseFilterForMaps: (value: boolean) => void;
  setDaysRange: (value?: DateRange) => void;
  setAdvancedUser: (value: boolean) => void;
  setDeltaMode: (value: DeltaMode) => void;
  setDeltaValueTxt: (value: string) => void;
  setAdvancedEntrada: (value: string) => void;
  setAdvancedSalida: (value: string) => void;
  setCircleStationsForGraphs: (value: string) => void;
  setQuickGraph: (value: QuickGraphKey | null) => void;
}
