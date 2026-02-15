// src/components/visualizations/VisualizationGraphs.tsx

"use client";

import React, {useMemo, useState} from "react";
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

    // Filter and sort graphs
    const {orderedGraphs, filteredGraphs, allKinds, allFormats, favoritesSet} = useMemo(() => {
        const ordered = [...(fileMode ? graphs! : chartsFromApi ?? [])].sort((a: any, b: any) =>
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
    }, [fileMode, graphs, chartsFromApi, persisted]);

    // Load chart data
    const {content, chartData} = useGraphData(
        selectedIndex,
        filteredGraphs,
        jsonMode,
        chartsFromApi,
        fileMode,
        graphs,
        apiBase
    );

    console.log("=== Current State ===");
    console.log("selectedIndex:", selectedIndex);
    console.log("content:", content);
    console.log("chartData:", chartData);

    // Navigation
    const selectIndex = (idx: number) => {
        setSelectedIndex(idx);
        const g = filteredGraphs[idx];
        if (g) {
            setPersisted((p) => ({...p, selectedGraphId: String(g.id)}));
        }
    };

    useGraphNavigation(
        selectedIndex,
        filteredGraphs.length - 1,
        () => selectIndex(Math.max(0, selectedIndex - 1)),
        () => selectIndex(Math.min(filteredGraphs.length - 1, selectedIndex + 1)),
        () => setPickerOpen((v) => !v)
    );

    // Favorites
    const toggleFavorite = (id: string) => {
        setPersisted((p) => {
            const set = new Set(p.favoritesIds);
            if (set.has(id)) {
                set.delete(id);
            } else {
                set.add(id);
            }
            return {...p, favoritesIds: Array.from(set)};
        });
    };

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
            <div
                className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
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
