import { useEffect, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import type {
  MapsAnalysisState,
  MapsAnalysisActions,
  MapKey,
  FilterKind,
  QuickGraphKey,
} from '@/components/sidebar/types/mapsAnalysis';

const DEFAULT_STATIONS_MAPS: Record<MapKey, string> = {
  mapa_densidad: "",
  mapa_circulo: "",
  mapa_voronoi: "",
  mapa_desplazamientos: "",
};

const DEFAULT_FILTER_STATE = {
  operator: ">",
  value: "65",
  dayPct: "20",
  days: "all",
  allowedFailDays: "5",
  stationsPct: "35",
  stationsList: "1;2;3",
  matrixSelection: "1",
};

const getDefaultState = (runId?: string): MapsAnalysisState => ({
  currentRunId: runId || null,

  selectedMaps: [],
  stationsMaps: { ...DEFAULT_STATIONS_MAPS },
  instantesMaps: {},
  mapUserName: "",

  filterKind: "EstValorDias" as FilterKind,
  filterState: { ...DEFAULT_FILTER_STATE },
  useFilterForMaps: false,

  generatedMaps: [],
  generatedFilters: [],

  advancedUser: false,
  deltaMode: "media" as const,
  deltaValueTxt: "",
  advancedEntrada: "",
  advancedSalida: "",
  deltaInMin: 15,

  isGenerating: false,
  lastError: null,
  activeTab: 'maps' as const,
  seleccionAgreg: "1",
  entrada: "",
  salida: "",
  labelsMaps: {},
  circleStationsForGraphs: "",
  quickGraph: null,
});

const STORAGE_KEY_PREFIX = 'maps-analysis-state';

export function useMapsAnalysisState(runId?: string): [
  MapsAnalysisState,
  MapsAnalysisActions,
  boolean
] {
  const storageKey = runId ? `${STORAGE_KEY_PREFIX}-${runId}` : STORAGE_KEY_PREFIX;

  const [state, setState, hydrated] = usePersistentState<MapsAnalysisState>(
    storageKey,
    getDefaultState(runId)
  );

  useEffect(() => {
    if (runId && runId !== state.currentRunId) {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setState(getDefaultState(runId));
      } else {
        setState(prev => ({ ...prev, currentRunId: runId }));
      }
    }
  }, [runId, state.currentRunId, storageKey, setState]);

  const setSelectedMaps = useCallback((maps: MapKey[] | ((prev: MapKey[]) => MapKey[])) => {
    setState(prev => ({
      ...prev,
      selectedMaps: typeof maps === 'function' ? maps(prev.selectedMaps) : maps
    }));
  }, [setState]);

  const setStationsMaps = useCallback((
    stations: Record<MapKey, string> | ((prev: Record<MapKey, string>) => Record<MapKey, string>)
  ) => {
    setState(prev => ({
      ...prev,
      stationsMaps: typeof stations === 'function' ? stations(prev.stationsMaps) : stations
    }));
  }, [setState]);

  const setInstantesMaps = useCallback((
    instants: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    setState(prev => ({
      ...prev,
      instantesMaps: typeof instants === 'function' ? instants(prev.instantesMaps) : instants
    }));
  }, [setState]);

  const setMapUserName = useCallback((name: string) => {
    setState(prev => ({ ...prev, mapUserName: name }));
  }, [setState]);

  const setFilterKind = useCallback((kind: FilterKind) => {
    setState(prev => ({ ...prev, filterKind: kind }));
  }, [setState]);

  const setFilterState = useCallback((
    stateOrUpdater: typeof DEFAULT_FILTER_STATE | ((prev: typeof DEFAULT_FILTER_STATE) => typeof DEFAULT_FILTER_STATE)
  ) => {
    setState(prev => ({
      ...prev,
      filterState: typeof stateOrUpdater === 'function'
        ? stateOrUpdater(prev.filterState)
        : stateOrUpdater
    }));
  }, [setState]);

  const setUseFilterForMaps = useCallback((use: boolean) => {
    setState(prev => ({ ...prev, useFilterForMaps: use }));
  }, [setState]);

  const addGeneratedMap = useCallback((map: { type: string; path: string; thumbnail?: string }) => {
    const newMap = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ...map,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      generatedMaps: [newMap, ...prev.generatedMaps].slice(0, 20)
    }));
  }, [setState]);

  const addGeneratedFilter = useCallback((filter: { type: string; path: string; stations: number[] }) => {
    const newFilter = {
      id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      ...filter,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      generatedFilters: [newFilter, ...prev.generatedFilters].slice(0, 20)
    }));
  }, [setState]);

  const clearGenerated = useCallback(() => {
    setState(prev => ({
      ...prev,
      generatedMaps: [],
      generatedFilters: []
    }));
  }, [setState]);

  const setAdvancedUser = useCallback((advanced: boolean) => {
    setState(prev => ({ ...prev, advancedUser: advanced }));
  }, [setState]);

  const setDeltaMode = useCallback((mode: "media" | "acumulada") => {
    setState(prev => ({ ...prev, deltaMode: mode }));
  }, [setState]);

  const setDeltaValueTxt = useCallback((value: string) => {
    setState(prev => ({ ...prev, deltaValueTxt: value }));
  }, [setState]);

  const setAdvancedEntrada = useCallback((value: string) => {
    setState(prev => ({ ...prev, advancedEntrada: value }));
  }, [setState]);

  const setAdvancedSalida = useCallback((value: string) => {
    setState(prev => ({ ...prev, advancedSalida: value }));
  }, [setState]);

  const setEntrada = useCallback((value: string) => {
    setState(prev => ({ ...prev, entrada: value }));
  }, [setState]);

  const setSalida = useCallback((value: string) => {
    setState(prev => ({ ...prev, salida: value }));
  }, [setState]);

  const setLabelsMaps = useCallback((value: Record<string, boolean>) => {
    setState(prev => ({ ...prev, labelsMaps: value }));
  }, [setState]);

  const setCircleStationsForGraphs = useCallback((value: string) => {
    setState(prev => ({ ...prev, circleStationsForGraphs: value }));
  }, [setState]);

  const setQuickGraph = useCallback((value: QuickGraphKey | null) => {
    setState(prev => ({ ...prev, quickGraph: value }));
  }, [setState]);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState(prev => ({ ...prev, isGenerating }));
  }, [setState]);

  const setLastError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, lastError: error }));
  }, [setState]);

  const setActiveTab = useCallback((tab: 'maps' | 'graphs' | 'filters') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, [setState]);

  const setSeleccionAgreg = useCallback((value: string) => {
    setState(prev => ({ ...prev, seleccionAgreg: value }));
  }, [setState]);

  const reset = useCallback(() => {
    setState(getDefaultState(runId));
  }, [setState, runId]);

  const actions: MapsAnalysisActions = {
    setSelectedMaps,
    setStationsMaps,
    setInstantesMaps,
    setMapUserName,
    setFilterKind,
    setFilterState,
    setUseFilterForMaps,
    addGeneratedMap,
    addGeneratedFilter,
    clearGenerated,
    setAdvancedUser,
    setDeltaMode,
    setDeltaValueTxt,
    setAdvancedEntrada,
    setAdvancedSalida,
    setEntrada,
    setSalida,
    setLabelsMaps,
    setCircleStationsForGraphs,
    setQuickGraph,
    setIsGenerating,
    setLastError,
    setActiveTab,
    setSeleccionAgreg,
    reset,
  };

  return [state, actions, hydrated];
}
