// components/visualization-graphs.tsx

"use client";

import React, {useEffect, useMemo, useState} from "react";

import {LineChart, BarChart} from "@mui/x-charts";
import {
  ChartSpline,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  MoreVertical,
  Search,
  Filter,
} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {GraphItem} from "@/components/visualizations-panel";

type BackendChart = {
  id: string;
  kind: "graph" | "heatmap" | string;
  format: "json" | string;
  x: (number | string)[];
  series: Record<string, number[]>;
  meta?: {
    type?: "bar" | "line" | "area" | string;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    freq?: boolean;
    media?: boolean;
    [k: string]: any;
  };
};

type ChartDataState =
  | {
      x: (string | number)[];
      series: {
        key: string;
        label: string;
        data: number[];
        derived?: boolean;
      }[];
    }
  | null;

type VisualizationGraphsProps = {
  runId: string;
  apiBase: string;
  graphs?: GraphItem[];          // file mode (JSON files)
  chartsFromApi?: BackendChart[]; // API JSON mode
};

type PersistedState = {
  selectedGraphId?: string;
  favoritesIds: string[];
  historyOpen?: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;   // "" = all
  formatFilter: string; // "" = all
};

function lsKey(runId: string) {
  return `viz_graphs:${runId}`;
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

const prettyGraphName = (raw: string) => {
  let s = raw.replace(/^\d{8}_\d{6}_/, "");
  s = s.replace(/_/g, " ");
  return s.trim();
};

function buildChartData(chart: BackendChart): ChartDataState {
  if (!chart || !chart.x || !chart.series) return null;
  const x = chart.x;
  const keys = Object.keys(chart.series);
  if (!keys.length) return null;

  const base: ChartDataState = {
    x,
    series: keys.map((k) => ({
      key: k,
      label: k,
      data: (chart.series[k] ?? []).map((v) => Number(v)),
    })),
  };

  // derived: total/count -> avg
  const hasTotal = keys.includes("total");
  const hasCount = keys.includes("count");
  if (hasTotal && hasCount) {
    const total = chart.series["total"].map((v) => Number(v));
    const count = chart.series["count"].map((v) => Number(v));
    const avg = total.map((v, i) => (count[i] ? v / count[i] : 0));
    base.series.push({
      key: "avg",
      label: "avg (total / count)",
      data: avg,
      derived: true,
    });
  }

  // derived: single series -> cumulative
  if (base.series.length === 1) {
    const s = base.series[0];
    const cum: number[] = [];
    let acc = 0;
    for (const v of s.data) {
      acc += v;
      cum.push(acc);
    }
    base.series.push({
      key: `${s.key}_cumulative`,
      label: `${s.label} (cumulative)`,
      data: cum,
      derived: true,
    });
  }

  return base;
}

export default function VisualizationGraphs({runId, apiBase, graphs, chartsFromApi}: VisualizationGraphsProps) {
  const fileMode = !!graphs;
  const jsonMode = !!chartsFromApi;

  const [pickerOpen, setPickerOpen] = useState(false);

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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [content, setContent] = useState<BackendChart | null>(null);
  const [chartData, setChartData] = useState<ChartDataState>(null);

  const [visualType, setVisualType] = useState<"auto" | "bar" | "line" | "area">("auto");

  // load persisted state
  useEffect(() => {
    const saved = safeParse<PersistedState>(localStorage.getItem(lsKey(runId)));
    if (saved) {
      setPersisted({
        selectedGraphId: saved.selectedGraphId,
        favoritesIds: saved.favoritesIds ?? [],
        historyOpen: saved.historyOpen ?? false,
        searchText: saved.searchText ?? "",
        onlyFavorites: saved.onlyFavorites ?? false,
        kindFilter: saved.kindFilter ?? "",
        formatFilter: saved.formatFilter ?? "",
      });
      setPickerOpen(Boolean(saved.historyOpen));
    } else {
      setPersisted((p) => ({...p, favoritesIds: []}));
      setPickerOpen(false);
    }
    setHydrated(true);
  }, [runId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      lsKey(runId),
      JSON.stringify({...persisted, historyOpen: pickerOpen}),
    );
  }, [persisted, pickerOpen, hydrated, runId]);

  // list items: same idea as maps
  const orderedGraphs = useMemo(() => {
    const copy = [...((fileMode ? graphs : chartsFromApi) ?? [])];
    copy.sort((a: any, b: any) =>
      String(a.created ?? "").localeCompare(String(b.created ?? "")),
    );
    return copy as any[];
  }, [fileMode, graphs, chartsFromApi]);

  const allKinds = useMemo(() => {
    const s = new Set<string>();
    orderedGraphs.forEach((m) => s.add(String(m.kind ?? "")));
    return Array.from(s).filter(Boolean).sort();
  }, [orderedGraphs]);

  const allFormats = useMemo(() => {
    const s = new Set<string>();
    orderedGraphs.forEach((m) => s.add(String(m.format ?? "")));
    return Array.from(s).filter(Boolean).sort();
  }, [orderedGraphs]);

  const favoritesSet = useMemo(
    () => new Set(persisted.favoritesIds),
    [persisted.favoritesIds],
  );

  const filteredGraphs = useMemo(() => {
    const q = persisted.searchText.trim().toLowerCase();
    return orderedGraphs.filter((m: any) => {
      const id = String(m.id);
      if (persisted.onlyFavorites && !favoritesSet.has(id)) return false;
      if (persisted.kindFilter && String(m.kind ?? "") !== persisted.kindFilter)
        return false;
      if (
        persisted.formatFilter &&
        String(m.format ?? "") !== persisted.formatFilter
      )
        return false;
      if (!q) return true;
      const name = String(m.name ?? "").toLowerCase();
      const pretty = prettyGraphName(String(m.name ?? "")).toLowerCase();
      const kind = String(m.kind ?? "").toLowerCase();
      return (
        name.includes(q) ||
        pretty.includes(q) ||
        kind.includes(q) ||
        id.includes(q)
      );
    });
  }, [
    orderedGraphs,
    persisted.searchText,
    persisted.onlyFavorites,
    persisted.kindFilter,
    persisted.formatFilter,
    favoritesSet,
  ]);

  const selectIndex = (idx: number) => {
    setSelectedIndex(idx);
    const g = filteredGraphs[idx] as any;
    if (g) {
      const id = String(g.id);
      setPersisted((p) =>
        p.selectedGraphId === id ? p : {...p, selectedGraphId: id},
      );
    }
  };

  // auto‑select on mount / filters change
  useEffect(() => {
    if (!hydrated) return;
    if (!filteredGraphs.length) {
      setSelectedIndex(0);
      setContent(null);
      setChartData(null);
      return;
    }
    if (persisted.selectedGraphId) {
      const idx = filteredGraphs.findIndex(
        (m: any) => String(m.id) === String(persisted.selectedGraphId),
      );
      if (idx >= 0) {
        setSelectedIndex(idx);
        return;
      }
    }
    setSelectedIndex(filteredGraphs.length - 1);
  }, [hydrated, runId, filteredGraphs, persisted.selectedGraphId]);

  // keyboard: same spirit as maps
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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredGraphs, selectedIndex]);

  // when selectedIndex changes, load JSON similar to old VisualizationGraphs
  useEffect(() => {
    const active: any = filteredGraphs[selectedIndex];
    if (!active) {
      setContent(null);
      setChartData(null);
      return;
    }

    const id = String(active.id);

    const load = async () => {
      // JSON mode: chartsFromApi already has BackendChart
      if (jsonMode && chartsFromApi) {
        const chart = chartsFromApi.find((c) => String(c.id) === id);
        if (!chart) {
          setContent(null);
          setChartData(null);
          return;
        }
        setContent(chart);
        setChartData(buildChartData(chart));
        return;
      }

      // file mode: fetch JSON like original component
      if (!fileMode || !graphs) {
        setContent(null);
        setChartData(null);
        return;
      }
      const item = graphs.find((g) => String(g.id) === id);
      if (!item) {
        setContent(null);
        setChartData(null);
        return;
      }
      try {
        const url =
          (item as any).api_full_url || `${apiBase}${(item as any).url}`;
        const res = await fetch(url, {cache: "no-store"});
        const json = (await res.json()) as BackendChart;
        if (!json || !json.x || !json.series) {
          setContent(null);
          setChartData(null);
          return;
        }
        // force id so it matches item.id
        json.id = id;
        setContent(json);
        setChartData(buildChartData(json));
      } catch {
        setContent(null);
        setChartData(null);
      }
    };

    void load();
  }, [selectedIndex, filteredGraphs, jsonMode, chartsFromApi, fileMode, graphs, apiBase]);

  if (!orderedGraphs || orderedGraphs.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4 text-sm">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ChartSpline className="h-5 w-5" />
          Analytics Graph Creator
        </div>
        <p>No graph results found for this run.</p>
      </div>
    );
  }

  const active = filteredGraphs[selectedIndex] as any;
  if (!active) {
    return (
      <div className="flex flex-col gap-2 p-4 text-sm">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ChartSpline className="h-5 w-5" />
          Analytics Graph Creator
        </div>
        <p>No graphs match filters. Adjust search/filters or disable “only favorites”.</p>
      </div>
    );
  }

  const href =
    (active as any).api_full_url ?? `${apiBase}${(active as any).url}`;
  const displayName = prettyGraphName(String(active.name ?? active.id));
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < filteredGraphs.length - 1;
  const activeId = String(active.id);
  const isFav = favoritesSet.has(activeId);

  const metaFromContent = (content?.meta ?? {}) as any;
  const metaFromItem = (active.meta ?? {}) as any;
  const meta = {...metaFromItem, ...metaFromContent};

  const baseType = (meta.type as string | undefined) ?? "bar";
  const finalType =
    visualType === "auto" ? (baseType as "bar" | "line" | "area") : visualType;

  const xLabel = meta.xLabel || "X";
  const yLabel = meta.yLabel || "Y";

  const ySeries = chartData?.series ?? [];
  const valueFormatter = (value: number | null) =>
    value == null ? "" : value.toFixed(2);
  const muiX = chartData?.x ?? [];
  const muiSeries = ySeries.map((s) => ({
    id: s.key,
    label: s.label,
    data: s.data,
  }));

  return (
    <>
      {/* MAIN VIEW PANEL (no Card) – same spirit as maps */}
      <div className="flex h-full w-full flex-col gap-2 p-2 text-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ChartSpline className="h-5 w-5" />
            <span className="font-semibold">Analytics Graph Creator</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span>
              {selectedIndex + 1} / {filteredGraphs.length} (filtered) ·{" "}
              {orderedGraphs.length} total
            </span>
          </div>
        </div>

        {/* Top info + controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>{meta.title || displayName || "Sin título"}</span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {finalType}
              </Badge>
              {isFav && (
                <Badge
                  variant="default"
                  className="flex items-center gap-1 text-[10px]"
                >
                  <Star className="h-3 w-3" />
                  Starred
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
              <span>{String(active.name ?? "")}</span>
              <span>·</span>
              <span>Format: {String(active.format ?? "")}</span>
              <span>·</span>
              <span>Kind: {String(active.kind ?? "")}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => selectIndex(Math.max(0, selectedIndex - 1))}
              disabled={!canPrev}
              aria-label="Previous graph"
              title="Previous (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                selectIndex(Math.min(filteredGraphs.length - 1, selectedIndex + 1))
              }
              disabled={!canNext}
              aria-label="Next graph"
              title="Next (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Visual override */}
            <select
              className="h-8 w-[8.5rem] rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
              value={visualType}
              onChange={(e) =>
                setVisualType(
                  e.target.value as "auto" | "bar" | "line" | "area",
                )
              }
            >
              <option value="auto">Auto (meta)</option>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
            </select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Graph actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setPersisted((p) => {
                      const set = new Set(p.favoritesIds);
                      if (set.has(activeId)) set.delete(activeId);
                      else set.add(activeId);
                      return {...p, favoritesIds: Array.from(set)};
                    })
                  }
                  className="text-xs"
                >
                  {isFav ? "Unfavorite" : "Favorite"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(href, "_blank", "noreferrer")}
                  className="text-xs"
                >
                  Open JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chart container */}
        <div className="mt-2 flex min-h-[260px] flex-1 flex-col rounded-md border border-surface-3 bg-surface-1 px-2 py-3">
          {chartData && muiX.length && muiSeries.length ? (
            finalType === "bar" ? (
              <BarChart
                height={320}
                xAxis={[{data: muiX, scaleType: "band", label: xLabel}]}
                series={muiSeries.map((s) => ({...s, valueFormatter}))}
                slotProps={{legend: {hidden: false}}}
              />
            ) : (
              <LineChart
                height={320}
                xAxis={[{data: muiX, scaleType: "band", label: xLabel}]}
                series={muiSeries.map((s) => ({
                  ...s,
                  valueFormatter,
                  ...(finalType === "area" ? {area: true} : {}),
                }))}
                slotProps={{legend: {hidden: false}}}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-tertiary">
              No numeric data available for this graph.
            </div>
          )}
        </div>

        {/* FOOTER (no card) */}
        <div className="mt-1 flex items-center justify-between text-[11px] text-text-tertiary">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              X: <span className="font-medium text-text-primary">{xLabel}</span>
            </span>
            <span>
              Y: <span className="font-medium text-text-primary">{yLabel}</span>
            </span>
            {ySeries.some((s) => s.derived) && (
              <span className="italic">
                Includes derived series (e.g. averages or cumulative).
              </span>
            )}
          </div>
          <span>Shortcuts: ←/→ navigate · H history</span>
        </div>
      </div>

      {/* BOTTOM SHEET – history (same structure as maps, but for graphs) */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="p-0 bg-surface-1 border-t border-surface-3">
          <div className="p-4 border-b border-surface-3 bg-surface-1/92 backdrop-blur-md">
            <SheetHeader>
              <SheetTitle className="text-sm text-text-primary">
                Graphs history ({filteredGraphs.length} shown / {orderedGraphs.length} total)
              </SheetTitle>
            </SheetHeader>
          </div>

          <div className="px-4 pb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-[11px] text-text-secondary">Search</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    className="h-8 pl-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    value={persisted.searchText}
                    onChange={(e) =>
                      setPersisted((p) => ({...p, searchText: e.target.value}))
                    }
                    placeholder="name, kind, id…"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-text-secondary">Filters</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 bg-surface-1 border border-surface-3 hover:bg-surface-0"
                    onClick={() =>
                      setPersisted((p) => ({
                        ...p,
                        kindFilter: "",
                        formatFilter: "",
                        onlyFavorites: false,
                        searchText: "",
                      }))
                    }
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Reset
                  </Button>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={persisted.onlyFavorites}
                      onCheckedChange={(v) =>
                        setPersisted((p) => ({...p, onlyFavorites: Boolean(v)}))
                      }
                      className="border-surface-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/25"
                    />
                    <span className="text-xs text-text-secondary">
                      Only favorites
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-text-secondary">Kind / Format</Label>
                <div className="flex gap-2">
                  <select
                    className="h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    value={persisted.kindFilter}
                    onChange={(e) =>
                      setPersisted((p) => ({...p, kindFilter: e.target.value}))
                    }
                  >
                    <option value="">All kinds</option>
                    {allKinds.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    value={persisted.formatFilter}
                    onChange={(e) =>
                      setPersisted((p) => ({...p, formatFilter: e.target.value}))
                    }
                  >
                    <option value="">All formats</option>
                    {allFormats.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-text-tertiary">
              Shortcuts: ←/→ navigate · H history
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="max-h-[50vh] overflow-y-auto rounded-md border border-surface-3 bg-surface-1">
              <ul className="divide-y divide-surface-3">
                {filteredGraphs.map((m: any, idx: number) => {
                  const title = prettyGraphName(String(m.name ?? m.id));
                  const selected = idx === selectedIndex;
                  const id = String(m.id);
                  const fav = favoritesSet.has(id);

                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={[
                          "w-full px-3 py-2 text-left",
                          "transition-colors",
                          "hover:bg-surface-0/70",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                          selected ? "bg-accent-soft" : "",
                        ].join(" ")}
                        onClick={() => {
                          selectIndex(idx);
                          setPickerOpen(false);
                        }}
                        title={String(m.name)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className={[
                                "text-xs font-semibold truncate",
                                selected ? "text-accent" : "text-text-primary",
                              ].join(" ")}
                            >
                              {title}
                            </div>
                            <div className="text-[11px] text-text-tertiary truncate">
                              {String(m.kind ?? "")} · {String(m.format ?? "")} ·
                              id {id}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {fav && <Star className="h-4 w-4 text-accent" />}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-text-secondary hover:text-text-primary hover:bg-surface-0/70"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPersisted((p) => {
                                  const set = new Set(p.favoritesIds);
                                  if (set.has(id)) set.delete(id);
                                  else set.add(id);
                                  return {...p, favoritesIds: Array.from(set)};
                                });
                              }}
                              aria-label={fav ? "Unfavorite" : "Favorite"}
                              title={fav ? "Unfavorite" : "Favorite"}
                            >
                              {fav ? (
                                <StarOff className="h-4 w-4" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

        </SheetContent>
      </Sheet>
        <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 bg-surface-1 border border-surface-3 hover:bg-surface-0"
              onClick={() => setPickerOpen(true)}
            >
              History
            </Button>
    </>
  );
}
