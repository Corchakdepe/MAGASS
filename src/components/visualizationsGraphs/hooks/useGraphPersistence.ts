// src/components/visualizations/hooks/useGraphPersistence.ts

import { useState, useEffect } from "react";
import type { PersistedState } from "../types";

export function useGraphPersistence(runId: string) {
  const lsKey = `viz-graphs-${runId}`;

  const [persisted, setPersisted] = useState<PersistedState>({
    selectedGraphId: undefined,
    favoritesIds: [],
    historyOpen: false,
    searchText: "",
    onlyFavorites: false,
    kindFilter: "",
    formatFilter: "",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(lsKey);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedState;
        setPersisted({
          selectedGraphId: parsed.selectedGraphId,
          favoritesIds: parsed.favoritesIds ?? [],
          historyOpen: parsed.historyOpen ?? false,
          searchText: parsed.searchText ?? "",
          onlyFavorites: parsed.onlyFavorites ?? false,
          kindFilter: parsed.kindFilter ?? "",
          formatFilter: parsed.formatFilter ?? "",
        });
      }
    } catch (error) {
      console.error("Error loading persisted state:", error);
    }
    setHydrated(true);
  }, [lsKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(persisted));
    } catch (error) {
      console.error("Error saving persisted state:", error);
    }
  }, [persisted, hydrated, lsKey]);

  return { persisted, setPersisted, hydrated };
}
