// src/components/visualizations/VisualizationGraphs.tsx

"use client";

import React, {useMemo, useState, useEffect, useCallback} from "react";
import {ChartAnalytics} from "@/components/analytics/components/ChartAnalytics";
import {GraphHeader} from "./GraphHeader";
import {GraphFooter} from "./GraphFooter";
import {ChartRenderer} from "./ChartRenderer";
import {GraphPicker} from "./GraphPicker";
import {useGraphPersistence} from "../hooks/useGraphPersistence";
import {useGraphData} from "../hooks/useGraphData";
import {useGraphNavigation} from "../hooks/useGraphNavigation";
import {formatXAxisLabel, prettyGraphName} from "../utils/formatters";
import {isStandardizedChart} from "../utils/chartDataBuilders";
import type {BackendChart, GraphItem} from "../types";
import {GraphConfiguration} from "@/components/visualizationsGraphs/components/GraphConfiguration";
import { Button } from "@/components/ui/button";

// Loading skeleton component
function GraphsLoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <div className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
        <div className="h-14 border-b border-surface-3 bg-surface-2/50 animate-pulse" />
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <div className="text-sm text-text-secondary">Loading graphs...</div>
          </div>
        </div>
        <div className="h-12 border-t border-surface-3 bg-surface-2/50 animate-pulse" />
      </div>
    </div>
  );
}

interface VisualizationGraphsProps {
    runId: string;
    apiBase: string;
    graphs?: GraphItem[];
    chartsFromApi?: BackendChart[];
}

export default function VisualizationGraphs({
    runId,
    apiBase,
    graphs,
    chartsFromApi,
}: VisualizationGraphsProps) {
    // Loading states
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingContexts, setIsLoadingContexts] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    const fileMode = !!graphs;
    const jsonMode = !!chartsFromApi;

    console.log("=== VisualizationGraphs ===");
    console.log("runId:", runId);
    console.log("apiBase:", apiBase);
    console.log("fileMode:", fileMode);
    console.log("jsonMode:", jsonMode);
    console.log("graphs count:", graphs?.length);
    console.log("chartsFromApi count:", chartsFromApi?.length);

    const {persisted, setPersisted, hydrated} = useGraphPersistence(runId);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [visualType, setVisualType] = useState<"auto" | "bar" | "line" | "area">("auto");
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [localGraphs, setLocalGraphs] = useState<GraphItem[]>([]);
    const [enrichedGraphs, setEnrichedGraphs] = useState<any[]>([]);

    useEffect(() => {
        setLocalGraphs(graphs ?? []);
    }, [graphs]);

    // Fetch all graph metadata in parallel
    const fetchAllGraphContexts = useCallback(async (graphsToEnrich: GraphItem[]) => {
        if (!graphsToEnrich || graphsToEnrich.length === 0) {
            setIsInitialLoading(false);
            return;
        }

        setIsLoadingContexts(true);
        setLoadingError(null);

        const enriched: any[] = [];
        let completed = 0;

        try {
            await Promise.all(graphsToEnrich.map(async (graph) => {
                try {
                    if (graph.context) {
                        enriched.push(graph);
                    } else {
                        const id = String(graph.id);
                        const url = graph.apifullurl ?? (graph.url ? `${apiBase}/${graph.url}` : "");

                        if (url) {
                            const response = await fetch(url, { cache: "no-store" });
                            if (response.ok) {
                                const json = await response.json();
                                enriched.push({ ...graph, context: json.context || null });
                            } else {
                                enriched.push(graph);
                            }
                        } else {
                            enriched.push(graph);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch context for graph ${graph.id}:`, error);
                    enriched.push(graph);
                } finally {
                    completed++;
                    setLoadingProgress(Math.round((completed / graphsToEnrich.length) * 100));
                }
            }));

            setEnrichedGraphs(enriched);
        } catch (error) {
            console.error('Error fetching graph contexts:', error);
            setLoadingError('Failed to load graph metadata');
            setEnrichedGraphs(graphsToEnrich);
        } finally {
            setIsLoadingContexts(false);
            setIsInitialLoading(false);
        }
    }, [apiBase]);

    // Trigger context fetching when graphs are available
    useEffect(() => {
        if (fileMode && localGraphs.length > 0) {
            fetchAllGraphContexts(localGraphs);
        } else {
            setIsInitialLoading(false);
        }
    }, [fileMode, localGraphs, fetchAllGraphContexts]);

    // Filter and sort graphs
    const {orderedGraphs, filteredGraphs, allKinds, allFormats, favoritesSet} = useMemo(() => {
        const source = fileMode ? (enrichedGraphs.length > 0 ? enrichedGraphs : localGraphs) : (chartsFromApi ?? []);

        const ordered = [...source].sort((a: any, b: any) =>
            String(a.created ?? "").localeCompare(String(b.created ?? ""))
        );

        const kinds = new Set(ordered.map((m: any) => String(m.kind ?? "")).filter(Boolean));
        const formats = new Set(ordered.map((m: any) => String(m.format ?? "")).filter(Boolean));
        const favSet = new Set(persisted.favoritesIds);

        const filtered = ordered.filter((m: any) => {
            const id = String(m.id);
            if (persisted.onlyFavorites && !favSet.has(id)) return false;
            if (persisted.kindFilter && String(m.kind ?? "") !== persisted.kindFilter) return false;
            if (persisted.formatFilter && String(m.format ?? "") !== persisted.formatFilter) return false;

            const q = persisted.searchText.trim().toLowerCase();
            if (!q) return true;

            const name = String(m.name ?? "").toLowerCase();
            const pretty = prettyGraphName(String(m.name ?? "")).toLowerCase();
            const kind = String(m.kind ?? "").toLowerCase();

            return name.includes(q) || pretty.includes(q) || kind.includes(q) || id.includes(q);
        });

        return {
            orderedGraphs: ordered,
            filteredGraphs: filtered,
            allKinds: Array.from(kinds).sort(),
            allFormats: Array.from(formats).sort(),
            favoritesSet: favSet,
        };
    }, [fileMode, graphs, chartsFromApi, persisted, enrichedGraphs, localGraphs]);

    // Load chart data
    const {content, chartData} = useGraphData(
        selectedIndex,
        filteredGraphs,
        jsonMode,
        chartsFromApi,
        fileMode,
        localGraphs,
        apiBase
    );

    // Update localGraphs when chart data is loaded to include context in the picker
    useEffect(() => {
        if (content && content.context && fileMode) {
            const active = filteredGraphs[selectedIndex];
            if (active && !active.context) {
                setEnrichedGraphs(prev =>
                    prev.map(g => g.id === active.id ? { ...g, context: content.context } : g)
                );
            }
        }
    }, [content, selectedIndex, filteredGraphs, fileMode]);

    console.log("=== Current State ===");
    console.log("selectedIndex:", selectedIndex);
    console.log("content:", content);
    console.log("chartData:", chartData);

    // Navigation
    const selectIndex = useCallback((idx: number) => {
        setSelectedIndex(idx);
        const g = filteredGraphs[idx];
        if (g) {
            setPersisted((p) => ({...p, selectedGraphId: String(g.id)}));
        }
    }, [filteredGraphs, setPersisted]);

    useGraphNavigation(
        selectedIndex,
        filteredGraphs.length - 1,
        () => selectIndex(Math.max(0, selectedIndex - 1)),
        () => selectIndex(Math.min(filteredGraphs.length - 1, selectedIndex + 1)),
        () => setPickerOpen((v) => !v)
    );

    // Favorites
    const toggleFavorite = useCallback((id: string) => {
        setPersisted((p) => {
            const set = new Set(p.favoritesIds);
            if (set.has(id)) {
                set.delete(id);
            } else {
                set.add(id);
            }
            return {...p, favoritesIds: Array.from(set)};
        });
    }, [setPersisted]);

    // Show loading skeleton while initial data is being fetched
    if (isInitialLoading) {
        return <GraphsLoadingSkeleton />;
    }

    // Show loading progress if contexts are being enriched
    if (isLoadingContexts) {
        return (
            <div className="h-screen flex flex-col">
                <div className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
                    <div className="h-14 border-b border-surface-3 bg-surface-2/50" />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="space-y-4 text-center max-w-md px-4">
                            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
                            <div className="text-sm font-medium text-text-primary">
                                Loading graph metadata...
                            </div>
                            <div className="w-full bg-surface-2 rounded-full h-2">
                                <div
                                    className="bg-accent h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <div className="text-xs text-text-secondary">
                                {loadingProgress}% complete • {enrichedGraphs.length} of {localGraphs.length} graphs loaded
                            </div>
                        </div>
                    </div>
                    <div className="h-12 border-t border-surface-3 bg-surface-2/50" />
                </div>
            </div>
        );
    }

    // Show error state
    if (loadingError) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 p-8">
                <div className="text-xl font-semibold text-danger">{loadingError}</div>
                <p className="text-text-secondary">Please try refreshing the page</p>
                <Button onClick={() => window.location.reload()}>
                    Refresh Page
                </Button>
            </div>
        );
    }

    if (!orderedGraphs.length) {
        return <div>No graphs available</div>;
    }

    const active = filteredGraphs[selectedIndex];
    if (!active) {
        return <div>No matches</div>;
    }

    const activeId = String(active.id);
    const displayName = prettyGraphName(String(active.name ?? active.id));
    const isFav = favoritesSet.has(activeId);

    // Chart metadata
    let meta: any = {};
    if (content) {
        if (isStandardizedChart(content)) {
            meta = {
                type: content.visualization.recommended,
                title: content.context.title,
                xLabel: content.data.x.label,
                yLabel: "Value",
            };
        } else {
            meta = content.meta ?? {};
        }
    }

    const baseType = (meta.type as string | undefined) ?? "bar";
    const finalType = visualType === "auto" ? (baseType as "bar" | "line" | "area") : visualType;
    const xLabel = meta.xLabel || "X";
    const ySeries = chartData?.series ?? [];

    const muiX = chartData?.x ?? [];
    const muiSeries = ySeries.map((s) => ({
        id: s.key,
        label: s.label,
        data: s.data,
    }));

    let xUnit: string | undefined;
    if (content && isStandardizedChart(content)) {
        xUnit = content.data.x.unit;
    }

    const formattedXAxis = muiX.map((v) => formatXAxisLabel(v, xUnit));
    const valueFormatter = (value: number | null) =>
        value !== null ? value.toFixed(2) : "";

    return (
        <div className="h-screen flex flex-col">
            <div className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
                <GraphHeader
                    active={active}
                    displayName={displayName}
                    isFavorite={isFav}
                    canPrev={selectedIndex > 0}
                    canNext={selectedIndex < filteredGraphs.length - 1}
                    selectedIndex={selectedIndex}
                    totalGraphs={orderedGraphs.length}
                    totalFiltered={filteredGraphs.length}
                    showAnalytics={showAnalytics}
                    visualType={visualType}
                    onPrevious={() => selectIndex(Math.max(0, selectedIndex - 1))}
                    onNext={() => selectIndex(Math.min(filteredGraphs.length - 1, selectedIndex + 1))}
                    onToggleFavorite={() => toggleFavorite(activeId)}
                    onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
                    onOpenJSON={() => window.open((active as any).apifullurl ?? `${apiBase}${(active as any).url}`, "_blank")}
                    onVisualTypeChange={setVisualType}
                />

                {/* Chart/Analytics Area */}
                {!showAnalytics ? (
                    <div className="h-full w-full p-2">
                        <ChartRenderer
                            chartData={chartData}
                            finalType={finalType}
                            formattedXAxis={formattedXAxis}
                            xLabel={xLabel}
                            muiSeries={muiSeries}
                            valueFormatter={valueFormatter}
                        />
                         {content && <GraphConfiguration chart={content}/>}
                    </div>
                ) : (
                    <div className="h-full w-full overflow-y-auto overflow-x-hidden p-4">
                        {content && <ChartAnalytics chart={content}/>}
                    </div>
                )}

                <GraphFooter
                    active={active}
                    meta={meta}
                    displayName={displayName}
                    xLabel={xLabel}
                    yLabel={meta.yLabel || "Y"}
                    ySeries={ySeries}
                    isFavorite={isFav}
                    showAnalytics={showAnalytics}
                    onToggleFavorite={() => toggleFavorite(activeId)}
                    onOpenPicker={() => setPickerOpen(true)}
                />
            </div>

            <GraphPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                filteredGraphs={filteredGraphs}
                orderedGraphs={orderedGraphs}
                selectedIndex={selectedIndex}
                persisted={persisted}
                setPersisted={setPersisted}
                favoritesSet={favoritesSet}
                allKinds={allKinds}
                allFormats={allFormats}
                onSelectIndex={selectIndex}
                onToggleFavorite={toggleFavorite}
            />
        </div>
    );
}