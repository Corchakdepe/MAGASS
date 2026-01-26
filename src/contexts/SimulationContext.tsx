// contexts/SimulationContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { BikeSimulationContext } from '@/types/core-data';
import { ContextHelpers } from '@/types/core-data';

/**
 * Context value shape
 */
interface SimulationContextValue {
  // Current simulation context
  context: BikeSimulationContext | null;

  // Loading states
  loading: boolean;
  error: Error | null;

  // Actions
  setContext: (context: BikeSimulationContext | null) => void;
  updateContext: (updates: Partial<BikeSimulationContext>) => void;
  resetContext: () => void;
  loadContext: (runId: string) => Promise<void>;

  // Current run ID (convenience)
  currentRunId: string | null;
  setCurrentRunId: (runId: string | null) => void;
}

/**
 * Create context
 */
const SimulationContext = createContext<SimulationContextValue | null>(null);

/**
 * Provider props
 */
interface SimulationProviderProps {
  children: React.ReactNode;
  initialContext?: BikeSimulationContext;
  persistKey?: string; // LocalStorage key for persistence
}

/**
 * Provider component
 */
export function SimulationProvider({
  children,
  initialContext,
  persistKey = 'bikesim:current-context',
}: SimulationProviderProps) {
  const [context, setContextState] = useState<BikeSimulationContext | null>(
    initialContext || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  /**
   * Load context from localStorage on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const deserialized = ContextHelpers.fromJSON(parsed);
        setContextState(deserialized);
        setCurrentRunId(deserialized.meta.runId || null);
      }
    } catch (err) {
      console.error('Failed to load context from localStorage:', err);
    }
  }, [persistKey]);

  /**
   * Save context to localStorage when it changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!context) {
      localStorage.removeItem(persistKey);
      return;
    }

    try {
      const serialized = ContextHelpers.toJSON(context);
      localStorage.setItem(persistKey, JSON.stringify(serialized));
    } catch (err) {
      console.error('Failed to save context to localStorage:', err);
    }
  }, [context, persistKey]);

  /**
   * Set context
   */
  const setContext = useCallback((newContext: BikeSimulationContext | null) => {
    setContextState(newContext);
    setCurrentRunId(newContext?.meta.runId || null);
    setError(null);
  }, []);

  /**
   * Update context with partial data
   */
  const updateContext = useCallback((updates: Partial<BikeSimulationContext>) => {
    setContextState((prev) => {
      if (!prev) {
        // If no context exists, create a new one with the updates
        const base = ContextHelpers.createEmpty();
        return ContextHelpers.merge(base, updates);
      }
      return ContextHelpers.merge(prev, updates);
    });
    setError(null);
  }, []);

  /**
   * Reset context to empty state
   */
  const resetContext = useCallback(() => {
    setContextState(null);
    setCurrentRunId(null);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Load context for a specific run
   */
  const loadContext = useCallback(async (runId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Import API client dynamically to avoid circular dependencies
      const { simulationAPI } = await import('@/lib/api/simulation-client');
      const loadedContext = await simulationAPI.getRun(runId);

      setContextState(loadedContext);
      setCurrentRunId(runId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load context');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: SimulationContextValue = {
    context,
    loading,
    error,
    setContext,
    updateContext,
    resetContext,
    loadContext,
    currentRunId,
    setCurrentRunId,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

/**
 * Hook to use simulation context
 */
export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }

  return context;
}

/**
 * Hook to use current run ID
 */
export function useCurrentRunId(): string | null {
  const { currentRunId } = useSimulation();
  return currentRunId;
}

/**
 * Hook to use simulation artifacts
 */
export function useSimulationArtifacts() {
  const { context } = useSimulation();

  if (!context) {
    return {
      maps: [],
      graphs: [],
      filters: [],
      all: [],
    };
  }

  return {
    maps: Array.from(context.artifacts.maps.values()),
    graphs: Array.from(context.artifacts.graphs.values()),
    filters: Array.from(context.artifacts.filters.values()),
    all: ContextHelpers.getAllArtifacts(context),
  };
}

/**
 * Hook to use simulation parameters
 */
export function useSimulationParameters() {
  const { context } = useSimulation();
  return context?.config.parameters || null;
}

/**
 * Hook to use simulation infrastructure
 */
export function useSimulationInfrastructure() {
  const { context } = useSimulation();
  return context?.infrastructure || null;
}

/**
 * Hook to use simulation results
 */
export function useSimulationResults() {
  const { context } = useSimulation();
  return context?.results || null;
}

/**
 * Export context for advanced usage
 */
export { SimulationContext };