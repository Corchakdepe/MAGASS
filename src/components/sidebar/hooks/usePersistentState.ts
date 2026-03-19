// hooks/usePersistentState.ts
import { useState, useEffect, useCallback } from 'react';

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved, (key, value) => {
          // Revive Date objects
          if (key === 'createdAt' && value) {
            return new Date(value);
          }
          return value;
        });
        setState(parsed);
      }
    } catch (error) {
      console.error(`Error loading state from localStorage: ${error}`);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error saving state to localStorage: ${error}`);
      }
    }
  }, [key, state, hydrated]);

  const updateState = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      return newValue;
    });
  }, []);

  return [state, updateState, hydrated];
}