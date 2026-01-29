// src/components/visualizations/maps/VisualizationMaps.tsx

"use client";

import React, {useMemo, useState, useRef, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {useLanguage} from "@/contexts/LanguageContext";
import {MapHeader} from "../components/MapHeader";
import {MapFooter} from "../components/MapFooter";
import {MapViewer} from "../components/MapViewer";
import {MapPicker} from "../components/MapPicker";
import {useMapPersistence} from "../hooks/useMapPersistence";
import {useMapNavigation} from "../hooks/useMapNavigation";
import {useMapMessages} from "../hooks/useMapMessages";
import {sendToMap} from "../utils/messaging";
import {prettyMapName} from "../utils/formatters";
import type {VisualizationMapsProps} from "../types";

/**
 * Extract instant number from map name
 * Example: "MapaCirculos_instante2928D60S0.28C1624.37707.html" -> 2928
 */
const extractInstantFromName = (name: string): number => {
    const match = name.match(/instante(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
};

/**
 * Map backend map kinds to frontend map types
 */
// Replace your current getMapType with this:
const getMapType = (kind: string, filename: string = ""): string => {
    const typeMap: Record<string, string> = {
        MapaCirculos: "circles",
        MapaDensidad: "density",
        MapaDesplazamientos: "routes",
        MapaVoronoi: "voronoi",
        Voronoi: "voronoi",
    };

    if (typeMap[kind]) return typeMap[kind];

    // Derive from filename when kind is generic "map"
    if (filename.includes("MapaCirculos")) return "circles";
    if (filename.includes("MapaDensidad")) return "density";
    if (filename.includes("MapaDesplazamientos") || filename.includes("Desplazamientos"))
        return "routes";
    if (filename.includes("Voronoi")) return "voronoi";

    return kind.toLowerCase();
};


export default function VisualizationMaps({
                                              runId,
                                              apiBase,
                                              maps,
                                              onStationPick,
                                          }: VisualizationMapsProps) {
    const {t} = useLanguage();
    const {toast} = useToast();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [iframeError, setIframeError] = useState<string | null>(null);
    const [iframeReloadKey, setIframeReloadKey] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const {persisted, setPersisted, hydrated} = useMapPersistence(runId, pickerOpen);

    // Filter and sort maps
    const {orderedMaps, filteredMaps, allKinds, allFormats, favoritesSet} = useMemo(() => {
        const ordered = [...(maps ?? [])].sort((a, b) =>
            String(a.created ?? "").localeCompare(String(b.created ?? ""))
        );

        const kinds = new Set(ordered.map((m) => String(m.kind ?? "")).filter(Boolean));
        const formats = new Set(ordered.map((m) => String(m.format ?? "")).filter(Boolean));
        const favSet = new Set(persisted.favoritesIds);

        const filtered = ordered.filter((m) => {
            const id = String(m.id);

            if (persisted.onlyFavorites && !favSet.has(id)) return false;
            if (persisted.kindFilter && String(m.kind ?? "") !== persisted.kindFilter) return false;
            if (persisted.formatFilter && String(m.format ?? "") !== persisted.formatFilter)
                return false;

            const q = persisted.searchText.trim().toLowerCase();
            if (!q) return true;

            const name = String(m.name ?? "").toLowerCase();
            const pretty = prettyMapName(String(m.name ?? "")).toLowerCase();
            const kind = String(m.kind ?? "").toLowerCase();

            return name.includes(q) || pretty.includes(q) || kind.includes(q) || id.includes(q);
        });

        return {
            orderedMaps: ordered,
            filteredMaps: filtered,
            allKinds: Array.from(kinds).sort(),
            allFormats: Array.from(formats).sort(),
            favoritesSet: favSet,
        };
    }, [maps, persisted]);

    // Navigation
    const selectIndex = (idx: number) => {
        setSelectedIndex(idx);
        const m = filteredMaps[idx];
        if (m) {
            setPersisted((p) => ({...p, selectedMapId: String(m.id)}));
        }
    };

    const toggleFavorite = (id: string) => {
        setPersisted((p) => {
            const set = new Set(p.favoritesIds);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            return {...p, favoritesIds: Array.from(set)};
        });
    };

    const copyToClipboard = async (txt: string, label: string) => {
        try {
            await navigator.clipboard.writeText(txt);
            toast({title: t("copied"), description: label});
        } catch {
            toast({title: t("copyFailed"), description: t("clipboardNotAvailable")});
        }
    };

    const handleReload = () => {
        setIframeError(null);
        setIframeLoading(true);
        setIframeReloadKey((k) => k + 1);
    };

    const handleResetView = () => {
        sendToMap(iframeRef, {type: "MAP_COMMAND", command: "RESET_VIEW"});
        toast({title: t("commandSent"), description: t("resetViewIfSupported")});
    };

    // Sync selected index with persisted state
    useEffect(() => {
        if (!hydrated || filteredMaps.length === 0) return;

        setSelectedIndex((i) => Math.min(i, filteredMaps.length - 1));

        if (persisted.selectedMapId) {
            const idx = filteredMaps.findIndex((m) => String(m.id) === persisted.selectedMapId);
            if (idx >= 0) setSelectedIndex(idx);
        }
    }, [hydrated, filteredMaps, persisted.selectedMapId]);

    // Empty state - no maps at all
    if (!orderedMaps || orderedMaps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
                <div className="text-xl font-semibold text-muted-foreground">
                    {t("analyticsMapsCreator")}
                </div>
                <p className="text-muted-foreground">{t("noMapResultsForRun")}</p>
            </div>
        );
    }

    // No matches state - maps exist but filtered out
    if (!filteredMaps || filteredMaps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
                <div className="text-xl font-semibold text-muted-foreground">
                    {t("noMapsMatchFilters")}
                </div>
                <p className="text-muted-foreground">{t("adjustSearchOrDisableFavorites")}</p>
                <Button
                    onClick={() =>
                        setPersisted((p) => ({
                            ...p,
                            searchText: "",
                            onlyFavorites: false,
                            kindFilter: "",
                            formatFilter: "",
                        }))
                    }
                >
                    {t("resetFilters")}
                </Button>
            </div>
        );
    }

    // Get active map - guaranteed to exist here
    const active = filteredMaps[selectedIndex];

    // Safety check (should never happen after above checks, but TypeScript needs it)
    if (!active) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
                <p className="text-muted-foreground">No map selected</p>
            </div>
        );
    }

    const activeId = String(active.id);
    const isFav = favoritesSet.has(activeId);
    const href = active.api_full_url ?? (active.url ? `${apiBase}${active.url}` : "");
    const isHtml = active.format === "html";
   

    const displayName = prettyMapName(String(active.name ?? ""));

    // Extract map metadata for new MapLibre components
    const mapType = active
        ? getMapType(String(active.kind ?? ""), String(active.name ?? ""))
        : "";
    const instant = extractInstantFromName(String(active.name ?? ""));

    console.log("Active map:", {
        name: active.name,
        format: active.format,
        kind: active.kind,
        isHtml,
        mapType,
        instant,
    });

    // Wrap onStationPick to handle the expected signature
    const handleStationClick = (stationId: number) => {
        if (onStationPick) {
            // Create StationPickEvent object if that's what the parent expects
            onStationPick({station: stationId} as any);
        }
    };

    // Keyboard navigation
    useMapNavigation({
        selectedIndex,
        maxIndex: filteredMaps.length - 1,
        onPrevious: () => selectIndex(Math.max(0, selectedIndex - 1)),
        onNext: () => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1)),
        onToggleHistory: () => setPickerOpen((v) => !v),
        onOpen: () => window.open(href, "_blank", "noreferrer"),
        onReload: handleReload,
        onToggleFavorite: () => toggleFavorite(activeId),
    });

    // PostMessage handling with toast
    useMapMessages(onStationPick, (msg) => {
        toast({
            title: t("stationSelected"),
            description: `${t("station")} ${String(msg.station)}${
                msg.data != null ? ` · ${String(msg.data)}` : ""
            }`,
        });
    });

    // Main render - map viewer with full height
    return (
     <div className="h-screen flex flex-col">
            <div
                
                className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">        <MapHeader
                         displayName={displayName}
                isFavorite={isFav}
                onPrevious={() => selectIndex(Math.max(0, selectedIndex - 1))}
                onNext={() => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1))}
                selectedIndex={selectedIndex}
                totalMaps={orderedMaps.length}
                totalFiltered={filteredMaps.length}
                href={href}
                isHtml={isHtml}
                onToggleFavorite={() => toggleFavorite(activeId)}
                onOpen={() => window.open(href, "_blank", "noreferrer")}
                onReload={handleReload}
                onCopyLink={() => copyToClipboard(href, t("linkCopied"))}
                onCopyName={() => copyToClipboard(displayName, t("mapNameCopied"))}
                onResetView={handleResetView}
            />

            {/* Map Viewer - Flexible height (takes remaining space) */}
            <div className="flex-1 overflow-hidden">
                <MapViewer
                    isHtml={isHtml}
                    href={href}
                    displayName={displayName}
                    activeId={activeId}
                    iframeReloadKey={iframeReloadKey}
                    iframeLoading={iframeLoading}
                    iframeError={iframeError}
                    iframeRef={iframeRef}
                    mapType={mapType}
                    runId={runId}
                    instant={instant}
                    apiBase={apiBase}
                    onStationPick={handleStationClick}
                    onIframeLoad={() => {
                        setIframeLoading(false);
                        setIframeError(null);
                    }}
                    onIframeError={() => {
                        setIframeLoading(false);
                        setIframeError(t("iframeFailedToLoad"));
                    }}
                    onRetry={handleReload}
                    onOpen={() => window.open(href, "_blank", "noreferrer")}
                />
            </div>

            {/* Footer - Fixed height */}
            <MapFooter
                displayName={displayName}
                isFavorite={isFav}
                onToggleFavorite={() => toggleFavorite(activeId)}
                onOpenPicker={() => setPickerOpen(true)}
            />

            {/* Map Picker Sheet (slides from bottom) */}
            <MapPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                items={filteredMaps}
                selectedId={activeId}
                favorites={favoritesSet}
                persisted={persisted}
                allKinds={allKinds}
                allFormats={allFormats}
                onSelect={(map: any) => {
                    const idx = filteredMaps.findIndex((m) => m.id === map.id);
                    if (idx >= 0) selectIndex(idx);
                    setPickerOpen(false);
                }}
                onToggleFavorite={toggleFavorite}
                onUpdateFilters={(updates: any) => setPersisted((p) => ({...p, ...updates}))}
            />
        </div>
     </div>
    );
}
