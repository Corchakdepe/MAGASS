import type { DateRange } from "react-day-picker";

export type MapKey =
  | "mapa_densidad"
  | "mapa_circulo"
  | "mapa_voronoi"
  | "mapa_desplazamientos";

export type FilterOperator = ">=" | "<=" | ">" | "<" | "==" | "!=";
export type FilterKind = "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";

export type QuickGraphKey =
  | "graf_barras_est_med"
  | "graf_barras_est_acum"
  | "graf_linea_comp_est";

export const ALLOWED_GRAPH_MATRIX_IDS = [-1, 0, 1, 9, 10, 11, 12, 13] as const;

export interface UnifiedFilterState {
  operator: string;
  value: string;
  dayPct: string;
  days: string;
  allowedFailDays: string;
  stationsPct: string;
  stationsList: string;
  matrixSelection: string;
}

export interface MapConfig {
  id: string;
  type: MapKey;
  instant: number;
  stations?: number[];
  showLabels?: boolean;
  createdAt: Date;
}

export interface GeneratedMap {
  id: string;
  type: string;
  path: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface GeneratedFilter {
  id: string;
  type: string;
  path: string;
  stations: number[];
  createdAt: Date;
}

export interface MapsAnalysisState {
  currentRunId: string | null;

  selectedMaps: MapKey[];
  stationsMaps: Record<MapKey, string>;
  instantesMaps: Record<string, string>;
  mapUserName: string;

  filterKind: FilterKind;
  filterState: UnifiedFilterState;
  useFilterForMaps: boolean;

  generatedMaps: GeneratedMap[];
  generatedFilters: GeneratedFilter[];

  advancedUser: boolean;
  deltaMode: "media" | "acumulada";
  deltaValueTxt: string;
  advancedEntrada: string;
  advancedSalida: string;
  deltaInMin: number;

  isGenerating: boolean;
  lastError: string | null;
  activeTab: "maps" | "graphs" | "filters";

  seleccionAgreg: string;
  entrada: string;
  salida: string;
  labelsMaps: Record<string, boolean>;
  circleStationsForGraphs: string;
  quickGraph: QuickGraphKey | null;
}

export interface MapsAnalysisActions {
  setSelectedMaps: (maps: MapKey[] | ((prev: MapKey[]) => MapKey[])) => void;
  setStationsMaps: (stations: Record<MapKey, string> | ((prev: Record<MapKey, string>) => Record<MapKey, string>)) => void;
  setInstantesMaps: (instants: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setMapUserName: (name: string) => void;

  setFilterKind: (kind: FilterKind) => void;
  setFilterState: (state: UnifiedFilterState | ((prev: UnifiedFilterState) => UnifiedFilterState)) => void;
  setUseFilterForMaps: (use: boolean) => void;

  addGeneratedMap: (map: { type: string; path: string; thumbnail?: string }) => void;
  addGeneratedFilter: (filter: { type: string; path: string; stations: number[] }) => void;
  clearGenerated: () => void;

  setAdvancedUser: (advanced: boolean) => void;
  setDeltaMode: (mode: "media" | "acumulada") => void;
  setDeltaValueTxt: (value: string) => void;
  setAdvancedEntrada: (value: string) => void;
  setAdvancedSalida: (value: string) => void;
  setEntrada: (value: string) => void;
  setSalida: (value: string) => void;
  setLabelsMaps: (value: Record<string, boolean>) => void;
  setCircleStationsForGraphs: (value: string) => void;
  setQuickGraph: (value: QuickGraphKey | null) => void;

  setIsGenerating: (isGenerating: boolean) => void;
  setLastError: (error: string | null) => void;
  setActiveTab: (tab: "maps" | "graphs" | "filters") => void;
  setSeleccionAgreg: (value: string) => void;

  reset: () => void;
}

export interface MapsAnalysisPanelProps {
  runId?: string;
  externalStationsMaps?: Record<string, string>;
  onActiveStationsTargetKeyChange?: (key: MapKey) => void;
  onClearExternalStationsMaps?: () => void;
}
