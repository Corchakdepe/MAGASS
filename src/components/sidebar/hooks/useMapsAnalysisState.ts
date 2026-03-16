// hooks/useMapsAnalysisState.ts
import { useState, useEffect, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import type {
  MapsAnalysisState,
  MapsAnalysisActions,
  MapKey,
  FilterKind
} from '@/components/sidebar/types/mapsAnalysis';

// Default stations maps object
const DEFAULT_STATIONS_MAPS: Record<MapKey, string> = {
  mapa_densidad: "",
  mapa_circulo: "",
  mapa_voronoi: "",
  mapa_desplazamientos: "",
};

// Default filter state
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

// Default state
const getDefaultState = (runId?: string): MapsAnalysisState => ({
  // Run info
  currentRunId: runId || null,

  // Map selection and configuration
  selectedMaps: [],
  stationsMaps: { ...DEFAULT_STATIONS_MAPS },
  instantesMaps: {},
  mapUserName: "",

  // Filter configuration
  filterKind: "EstValorDias" as FilterKind,
  filterState: { ...DEFAULT_FILTER_STATE },
  useFilterForMaps: false,

  // Generated content
  generatedMaps: [],
  generatedFilters: [],

  // Advanced settings
  advancedUser: false,
  deltaMode: "media" as const,
  deltaValueTxt: "",
  advancedEntrada: "",
  advancedSalida: "",
  deltaInMin: 15, // Default delta in minutes

  // UI state
  isGenerating: false,
  lastError: null,
  activeTab: 'maps' as const,
  seleccionAgreg: "1", // Default to Ocupacion_Relativa (ID: 1)
  entrada: "",
  salida: "",
  labelsMaps: {},
  circleStationsForGraphs: "",
});

// Local storage key
const STORAGE_KEY_PREFIX = 'maps-analysis-state';

export function useMapsAnalysisState(runId?: string): [
  MapsAnalysisState,
  MapsAnalysisActions,
  boolean // hydrated
] {
  // Create a storage key that includes the runId
  const storageKey = runId ? `${STORAGE_KEY_PREFIX}-${runId}` : STORAGE_KEY_PREFIX;

  // Use persistent state with localStorage
  const [state, setState, hydrated] = usePersistentState<MapsAnalysisState>(
    storageKey,
    getDefaultState(runId)
  );

  // Reset state when runId changes
  useEffect(() => {
    if (runId && runId !== state.currentRunId) {
      // Load state for this specific runId from localStorage
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        // No saved state for this run, use default
        setState(getDefaultState(runId));
      } else {
        // Update the currentRunId in the loaded state
        setState(prev => ({ ...prev, currentRunId: runId }));
      }
    }
  }, [runId, state.currentRunId, storageKey, setState]);

  // Actions
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

  // Filter actions
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

  // Generated content actions
  const addGeneratedMap = useCallback((map: { type: string; path: string; thumbnail?: string }) => {
    const newMap = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...map,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      generatedMaps: [newMap, ...prev.generatedMaps].slice(0, 20) // Keep last 20
    }));
  }, [setState]);

  const addGeneratedFilter = useCallback((filter: { type: string; path: string; stations: number[] }) => {
    const newFilter = {
      id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...filter,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      generatedFilters: [newFilter, ...prev.generatedFilters].slice(0, 20) // Keep last 20
    }));
  }, [setState]);

  const clearGenerated = useCallback(() => {
    setState(prev => ({
      ...prev,
      generatedMaps: [],
      generatedFilters: []
    }));
  }, [setState]);

  // Advanced settings actions
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

  // UI actions
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

  // Reset
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
    setIsGenerating,
    setLastError,
    setActiveTab,
    setSeleccionAgreg,
    reset,
  };

  return [state, actions, hydrated];
}