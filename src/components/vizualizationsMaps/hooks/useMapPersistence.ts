// src/components/visualizations/maps/hooks/useMapPersistence.ts

import { useState, useEffect } from "react";
import type { PersistedState } from "../types";
import { lsKey } from "../utils/formatters";

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function useMapPersistence(runId: string, pickerOpen: boolean) {
  const [persisted, setPersisted] = useState<PersistedState>({
    selectedMapId: undefined,
    favoritesIds: [],
    historyOpen: false,
    searchText: "",
    onlyFavorites: false,
    kindFilter: "",
    formatFilter: "",
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = safeParse<PersistedState>(localStorage.getItem(lsKey(runId)));
    if (saved) {
      setPersisted({
        selectedMapId: saved.selectedMapId,
        favoritesIds: saved.favoritesIds ?? [],
        historyOpen: saved.historyOpen ?? false,
        searchText: saved.searchText ?? "",
        onlyFavorites: saved.onlyFavorites ?? false,
        kindFilter: saved.kindFilter ?? "",
        formatFilter: saved.formatFilter ?? "",
      });
    }
    setHydrated(true);
  }, [runId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(lsKey(runId), JSON.stringify({ ...persisted, historyOpen: pickerOpen }));
  }, [persisted, pickerOpen, hydrated, runId]);

  return { persisted, setPersisted, hydrated };
}
