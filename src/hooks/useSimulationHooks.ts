// hooks/useSimulationHooks.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { simulationAPI, SimulationAPIError } from '@/lib/api/simulation-client';
import type {
  BikeSimulationContext,
  AnalysisArtifact,
  SimulationParameters,
  RunsListResponse,
  AnalysisConfiguration, SimulationSummaryData,
} from '@/types/core-data';
import { useSimulation } from '@/contexts/SimulationContext';

/**
 * Hook to fetch simulation data
 */
export function useSimulationData(runId?: string) {
  const [data, setData] = useState<BikeSimulationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!runId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await simulationAPI.getRun(runId);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load simulation data');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    reload: loadData,
  };
}

/**
 * Hook to run a simulation
 */
export function useRunSimulation() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<BikeSimulationContext | null>(null);
  const { setContext } = useSimulation();

  const runSimulation = useCallback(
    async (
      params: SimulationParameters,
      folders?: { input?: string; output?: string; simName?: string }
    ) => {
      setRunning(true);
      setError(null);
      setResult(null);

      try {
        const context = await simulationAPI.runSimulation(params, folders);
        setResult(context);
        setContext(context); // Update global context
        return context;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Simulation failed');
        setError(error);
        throw error;
      } finally {
        setRunning(false);
      }
    },
    [setContext]
  );

  return {
    runSimulation,
    running,
    error,
    result,
  };
}

/**
 * Hook to run analysis (maps/graphs)
 */
export function useRunAnalysis() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { updateContext } = useSimulation();

  const runAnalysis = useCallback(
    async (config: AnalysisConfiguration) => {
      setRunning(true);
      setError(null);

      try {
        const response = await simulationAPI.runAnalysis(config);

        // Update context with new artifacts if any
        if (response.artifacts && response.artifacts.length > 0) {
          // This would need proper implementation in the context
          // to add artifacts to the appropriate maps
        }

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Analysis failed');
        setError(error);
        throw error;
      } finally {
        setRunning(false);
      }
    },
    [updateContext]
  );

  return {
    runAnalysis,
    running,
    error,
  };
}

/**
 * Hook to list all simulation runs
 */
export function useSimulationRuns() {
  const [runs, setRuns] = useState<RunsListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await simulationAPI.listRuns();
      setRuns(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load runs');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadRuns, 30000);
    return () => clearInterval(interval);
  }, [loadRuns]);

  return {
    runs: runs?.simulations || [],
    total: runs?.total || 0,
    loading,
    error,
    reload: loadRuns,
  };
}

/**
 * Hook to manage station selection
 */
export function useStationSelection(initialStations?: string) {
  const [stations, setStations] = useState<number[]>([]);

  // Parse initial stations
  useEffect(() => {
    if (initialStations) {
      parseAndSet(initialStations);
    }
  }, [initialStations]);

  const parseAndSet = useCallback((input: string) => {
    const parsed = parseStationsSimple(input);
    setStations(parsed);
  }, []);

  const toggle = useCallback((stationId: number) => {
    setStations((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  }, []);

  const add = useCallback((stationId: number) => {
    setStations((prev) => {
      if (prev.includes(stationId)) return prev;
      return [...prev, stationId];
    });
  }, []);

  const remove = useCallback((stationId: number) => {
    setStations((prev) => prev.filter((id) => id !== stationId));
  }, []);

  const clear = useCallback(() => {
    setStations([]);
  }, []);

  const formatted = useMemo(() => stations.join(';'), [stations]);
  const isEmpty = stations.length === 0;

  return {
    stations,
    formatted,
    isEmpty,
    parseAndSet,
    toggle,
    add,
    remove,
    clear,
    setStations,
  };
}

/**
 * Helper function to parse stations
 */
function parseStationsSimple(input: string): number[] {
  return Array.from(
    new Set(
      (input ?? '')
        .trim()
        .split(/[^0-9]+/g)
        .filter(Boolean)
        .map(Number)
    )
  )
    .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b);
}

/**
 * Hook to manage favorites
 */
export function useFavorites(kind: 'map' | 'graph') {
  const { context, updateContext } = useSimulation();

  const favorites = useMemo(() => {
    if (!context?.uiState) return new Set<string>();
    return kind === 'map'
      ? context.uiState.favoriteMapIds
      : context.uiState.favoriteGraphIds;
  }, [context, kind]);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  const toggle = useCallback(
    (id: string) => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }

      updateContext({
        uiState: {
          ...context?.uiState,
          favoriteMapIds: kind === 'map' ? newFavorites : context?.uiState?.favoriteMapIds || new Set(),
          favoriteGraphIds: kind === 'graph' ? newFavorites : context?.uiState?.favoriteGraphIds || new Set(),
        },
      });
    },
    [context, favorites, kind, updateContext]
  );

  return {
    favorites: Array.from(favorites),
    isFavorite,
    toggle,
  };
}

/**
 * Hook to manage artifact filtering
 */
export function useArtifactFilter<T extends AnalysisArtifact>(
  artifacts: T[],
  options?: {
    searchText?: string;
    kindFilter?: string;
    formatFilter?: string;
    onlyFavorites?: boolean;
    favoriteIds?: Set<string>;
  }
) {
  return useMemo(() => {
    if (!artifacts) return [];

    let filtered = [...artifacts];

    // Search filter
    if (options?.searchText) {
      const query = options.searchText.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.displayName.toLowerCase().includes(query) ||
          a.id.toLowerCase().includes(query)
      );
    }

    // Kind filter
    if (options?.kindFilter) {
      filtered = filtered.filter((a) => a.kind === options.kindFilter);
    }

    // Format filter
    if (options?.formatFilter) {
      filtered = filtered.filter((a) => a.format === options.formatFilter);
    }

    // Favorites filter
    if (options?.onlyFavorites && options?.favoriteIds) {
      filtered = filtered.filter((a) => options.favoriteIds!.has(a.id));
    }

    return filtered;
  }, [artifacts, options]);
}

/**
 * Hook for debounced search
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to manage analysis configuration builder
 */
export function useAnalysisConfigBuilder(runId: string) {
  const [config, setConfig] = useState<Partial<AnalysisConfiguration>>({
    runId,
    inputFolder: `./results/${runId}`,
    outputFolder: `./results/${runId}`,
    seleccionAgregacion: '-1',
  });

  const updateConfig = useCallback(
    (updates: Partial<AnalysisConfiguration>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const resetConfig = useCallback(() => {
    setConfig({
      runId,
      inputFolder: `./results/${runId}`,
      outputFolder: `./results/${runId}`,
      seleccionAgregacion: '-1',
    });
  }, [runId]);

  const isValid = useMemo(() => {
    return !!(
      config.runId &&
      config.inputFolder &&
      config.outputFolder &&
      (config.mapConfigs?.length || config.graphConfigs?.length)
    );
  }, [config]);

  return {
    config: config as AnalysisConfiguration,
    updateConfig,
    resetConfig,
    isValid,
  };
}

/**
 * Hook to auto-save state to localStorage
 */
export function useAutoSave<T>(
  key: string,
  value: T,
  delay: number = 1000
) {
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(debouncedValue));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, [key, debouncedValue]);
}

/**
 * Hook to load from localStorage
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error);
      }
    },
    [key]
  );

  return [value, setStoredValue];
}


// Add to useSimulationHooks.ts
export function useLatestSimulationWithSummary() {
  const { runs, loading: runsLoading, error, reload } = useSimulationRuns();
  const [summary, setSummary] = useState<SimulationSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (runs[0]) {
      setSummaryLoading(true);
      simulationAPI.getSimulationSummary(runs[0].name)
        .then(setSummary)
        .finally(() => setSummaryLoading(false));
    }
  }, [runs]);

  return {
    simulation: runs[0],
    summary,
    loading: runsLoading || summaryLoading,
    error,
    reload,
  };
}


/**
 * Hook for polling data
 */
export function usePolling(
  callback: () => Promise<void>,
  interval: number = 30000,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        await callback();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Run immediately
    poll();

    // Then set up interval
    const id = setInterval(poll, interval);

    return () => clearInterval(id);
  }, [callback, interval, enabled]);
}

/**
 * Export all hooks
 */
export {
  useSimulation,
  useCurrentRunId,
  useSimulationArtifacts,
  useSimulationParameters,
  useSimulationInfrastructure,
  useSimulationResults,
} from '@/contexts/SimulationContext';