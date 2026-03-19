// lib/analysis/graphs/hooks.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { GraphItem } from "@/components/visualizations-panel";

export type YScaleCfg = {
  min: number;
  max: number;
  step: number;
  integerOnly?: boolean;
};

export type GraphPersistedState = {
  selectedGraphId?: string;
  favoritesIds: string[];
  historyOpen?: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;
  formatFilter: string;
};

export const graphsLsKey = (runId: string) => `viz_graphs:${runId}`;

export const roundNumber = (v: number, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(v * factor) / factor;
};

const getCssVar = (name: string) =>
  typeof window === "undefined"
    ? ""
    : getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();

export const usePalette = () => {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const rawVars = [
      getCssVar("--chart-1"),
      getCssVar("--chart-2"),
      getCssVar("--chart-3"),
      getCssVar("--chart-4"),
      getCssVar("--chart-5"),
    ].filter(Boolean);
    const cssBaseColors = rawVars.map((v) => `hsl(${v})`);
    const fallback = "hsl(var(--primary))";
    setColors(cssBaseColors.length ? cssBaseColors : [fallback]);
  }, []);

  return colors;
};

export const prettyGraphLabel = (item: any) => {
  const raw = "name" in item && item.name ? String(item.name) : String(item.id);
  let s = raw.replace(/\.[^/.]+$/, "");
  s = s.replace(/^\d{8}_\d{6}_/, "");
  s = s.replace(/_/g, " ");
  return s.trim();
};

export const makeHistogramYScale = (values: number[]): YScaleCfg => {
  if (!values.length) {
    return { min: 0, max: 1, step: 1, integerOnly: true };
  }
  const max = Math.max(...values);
  const maxY = max * 1.05;
  const step = Math.max(1, Math.round(maxY / 8));
  return { min: 0, max: maxY, step, integerOnly: true };
};

export const makeTimeSeriesYScale = (values: number[]): YScaleCfg => {
  if (!values.length) {
    return { min: 0, max: 1, step: 1 };
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const beginAtZero = min >= 0;
  const minY = beginAtZero ? 0 : min;
  const maxY = max * 1.1;
  const step = Math.max(1, (maxY - minY) / 8 || 1);
  return { min: minY, max: maxY, step };
};

export const useGraphsPersistence = (
  runId: string,
): [GraphPersistedState, React.Dispatch<React.SetStateAction<GraphPersistedState>>, boolean, boolean, (open: boolean) => void] => {
  const [persisted, setPersisted] = useState<GraphPersistedState>({
    selectedGraphId: undefined,
    favoritesIds: [],
    historyOpen: false,
    searchText: "",
    onlyFavorites: false,
    kindFilter: "",
    formatFilter: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(graphsLsKey(runId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GraphPersistedState>;
        setPersisted({
          selectedGraphId: parsed.selectedGraphId,
          favoritesIds: parsed.favoritesIds ?? [],
          historyOpen: parsed.historyOpen ?? false,
          searchText: parsed.searchText ?? "",
          onlyFavorites: parsed.onlyFavorites ?? false,
          kindFilter: parsed.kindFilter ?? "",
          formatFilter: parsed.formatFilter ?? "",
        });
        setPickerOpen(Boolean(parsed.historyOpen));
      } else {
        setPersisted((p) => ({ ...p, favoritesIds: [] }));
        setPickerOpen(false);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [runId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      graphsLsKey(runId),
      JSON.stringify({ ...persisted, historyOpen: pickerOpen }),
    );
  }, [persisted, pickerOpen, hydrated, runId]);

  return [persisted, setPersisted, hydrated, pickerOpen, setPickerOpen];
};

export const useGraphsKeyboardShortcuts = (opts: {
  filteredGraphs: any[];
  selectedIndex: number;
  selectIndex: (idx: number) => void;
  toggleFavorite: (id: string) => void;
  setPickerOpen: (fn: (prev: boolean) => boolean) => void;
}) => {
  const { filteredGraphs, selectedIndex, selectIndex, toggleFavorite, setPickerOpen } =
    opts;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (isTyping) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedIndex > 0) selectIndex(selectedIndex - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedIndex < filteredGraphs.length - 1)
          selectIndex(selectedIndex + 1);
      }
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setPickerOpen((v) => !v);
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        const active = filteredGraphs[selectedIndex];
        if (!active) return;
        toggleFavorite(String(active.id));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredGraphs, selectedIndex, selectIndex, toggleFavorite, setPickerOpen]);
};