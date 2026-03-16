// src/components/sidebar/types/mapsAnalysis.ts
import type { DateRange } from "react-day-picker";

export type MapKey = 
  | "mapa_densidad" 
  | "mapa_circulo" 
  | "mapa_voronoi" 
  | "mapa_desplazamientos";

export type FilterOperator = ">=" | "<=" | ">" | "<" | "==" | "!=";
export type FilterKind = "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";

export interface UnifiedFilterState {
  operator: string;
  value: string;
  dayPct: string;          // times_per_day for EstValor/EstValorDias
  days: string;             // day indices separated by '#' or 'all'
  allowedFailDays: string;  // exception_days for EstValorDias
  stationsPct: string;      // percentage for Horas filter
  stationsList: string;     // stations for Porcentaje filter
  matrixSelection: string;  // matrix ID (default "1" for Ocupacion_Relativa)
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
  // Run info
  currentRunId: string | null;
  
  // Map selection and configuration
  selectedMaps: MapKey[];
  stationsMaps: Record<MapKey, string>;
  instantesMaps: Record<string, string>;
  mapUserName: string;
  
  // Filter configuration
  filterKind: FilterKind;
  filterState: UnifiedFilterState;
  useFilterForMaps: boolean;
  
  // Generated content
  generatedMaps: GeneratedMap[];
  generatedFilters: GeneratedFilter[];
  
  // Advanced settings
  advancedUser: boolean;
  deltaMode: "media" | "acumulada";
  deltaValueTxt: string;
  advancedEntrada: string;
  advancedSalida: string;
  deltaInMin: number;
  
  // UI state
  isGenerating: boolean;
  lastError: string | null;
  activeTab: 'maps' | 'graphs' | 'filters';
  
  // Matrix selection
  seleccionAgreg: string;

  // New fields to fix useMapsAnalysis and useQuickGraphs
  entrada: string;
  salida: string;
  labelsMaps: Record<string, boolean>;
  circleStationsForGraphs: string;
}

export interface MapsAnalysisActions {
  // Map actions
  setSelectedMaps: (maps: MapKey[] | ((prev: MapKey[]) => MapKey[])) => void;
  setStationsMaps: (stations: Record<MapKey, string> | ((prev: Record<MapKey, string>) => Record<MapKey, string>)) => void;
  setInstantesMaps: (instants: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setMapUserName: (name: string) => void;
  
  // Filter actions
  setFilterKind: (kind: FilterKind) => void;
  setFilterState: (state: UnifiedFilterState | ((prev: UnifiedFilterState) => UnifiedFilterState)) => void;
  setUseFilterForMaps: (use: boolean) => void;
  
  // Generated content actions
  addGeneratedMap: (map: { type: string; path: string; thumbnail?: string }) => void;
  addGeneratedFilter: (filter: { type: string; path: string; stations: number[] }) => void;
  clearGenerated: () => void;
  
  // Advanced settings actions
  setAdvancedUser: (advanced: boolean) => void;
  setDeltaMode: (mode: "media" | "acumulada") => void;
  setDeltaValueTxt: (value: string) => void;
  setAdvancedEntrada: (value: string) => void;
  setAdvancedSalida: (value: string) => void;
  setEntrada: (value: string) => void;
  setSalida: (value: string) => void;
  setLabelsMaps: (value: Record<string, boolean>) => void;
  setCircleStationsForGraphs: (value: string) => void;
  
  // UI actions
  setIsGenerating: (isGenerating: boolean) => void;
  setLastError: (error: string | null) => void;
  setActiveTab: (tab: 'maps' | 'graphs' | 'filters') => void;
  setSeleccionAgreg: (value: string) => void;
  
  // Reset
  reset: () => void;
}

export interface MapsAnalysisPanelProps {
  runId?: string;
  externalStationsMaps?: Record<string, string>;
  onActiveStationsTargetKeyChange?: (key: MapKey) => void;
  onClearExternalStationsMaps?: () => void;
}