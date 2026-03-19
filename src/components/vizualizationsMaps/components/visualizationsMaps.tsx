// src/components/visualizations/maps/VisualizationMaps.tsx

"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapHeader } from "./MapHeader";
import { MapFooter } from "./MapFooter";
import { MapViewer } from "./MapViewer";
import { MapPicker } from "./MapPicker";
import { MapConfiguration } from "./MapConfiguration";
import { useMapPersistence } from "../hooks/useMapPersistence";
import { useMapNavigation } from "../hooks/useMapNavigation";
import { useMapMessages } from "../hooks/useMapMessages";
import { sendToMap } from "../utils/messaging";
import {
  prettyMapName,
  getMapType,
  extractInstantFromName,
} from "../utils/mapUtils";
import type {
  VisualizationMapsProps,
  MapMetadata,
  MapContext,
  RawResultItem
} from "../types";
import {API_BASE} from "@/lib/analysis/constants";

// Loading skeleton component
function MapsLoadingSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="w-full h-[120vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
        <div className="h-14 border-b border-surface-3 bg-surface-2/50 animate-pulse" />
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
            <div className="text-sm text-text-secondary">Loading maps...</div>
          </div>
        </div>
        <div className="h-12 border-t border-surface-3 bg-surface-2/50 animate-pulse" />
      </div>
    </div>
  );
}

export default function VisualizationMaps({
  runId,
  apiBase,
  maps,
  onStationPick,
}: VisualizationMapsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ==================== STATE HOOKS ====================
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingContexts, setIsLoadingContexts] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mapJsonData, setMapJsonData] = useState<MapContext | null>(null);
  const [localMaps, setLocalMaps] = useState<RawResultItem[]>([]);
  const [enrichedMaps, setEnrichedMaps] = useState<RawResultItem[]>([]);

  const { persisted, setPersisted, hydrated } = useMapPersistence(runId, pickerOpen);

  // ==================== DATA FETCHING CALLBACKS ====================
  const fetchAllMapContexts = useCallback(async (mapsToEnrich: RawResultItem[]) => {
    if (!mapsToEnrich || mapsToEnrich.length === 0) {
      setIsInitialLoading(false);
      return;
    }

    setIsLoadingContexts(true);
    setLoadingError(null);

    const enriched: RawResultItem[] = [];
    let completed = 0;

    try {
      await Promise.all(mapsToEnrich.map(async (map) => {
        try {
          if (map.context) {
            enriched.push(map);
          } else {
            const baseName = map.name.replace(/\.(html|png|mp4)$/, '');
            const jsonFilename = `${baseName}.json`;
            const jsonUrl = `${API_BASE}/results/file/${runId}/${jsonFilename}`;

            const response = await fetch(jsonUrl);
            if (response.ok) {
              const context = await response.json();
              enriched.push({ ...map, context });
            } else {
              enriched.push(map);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch context for map ${map.id}:`, error);
          enriched.push(map);
        } finally {
          completed++;
          setLoadingProgress(Math.round((completed / mapsToEnrich.length) * 100));
        }
      }));

      setEnrichedMaps(enriched);
    } catch (error) {
      console.error('Error fetching map contexts:', error);
      setLoadingError('Failed to load map metadata');
      setEnrichedMaps(mapsToEnrich);
    } finally {
      setIsLoadingContexts(false);
      setIsInitialLoading(false);
    }
  }, [runId]);

  const fetchMapJson = useCallback(async (map: RawResultItem) => {
    if (!map?.name) return null;

    const baseName = map.name.replace(/\.(html|png|mp4)$/, '');
    const jsonFilename = `${baseName}.json`;
    const jsonUrl = `${API_BASE}/results/file/${runId}/${jsonFilename}`;

    try {
      const response = await fetch(jsonUrl);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch map JSON:", error);
    }
    return null;
  }, [runId]);

  // ==================== USEMEMO FOR FILTERED MAPS ====================
  // This MUST come before any callbacks that depend on filteredMaps
  const { orderedMaps, filteredMaps, allKinds, allFormats, favoritesSet } = useMemo(() => {
    const mapsToUse = enrichedMaps.length > 0 ? enrichedMaps : localMaps;

    const ordered = [...mapsToUse].sort((a, b) =>
      String(a.created ?? "").localeCompare(String(b.created ?? ""))
    );

    const kinds = new Set(ordered.map((m) => String(m.kind ?? "")).filter(Boolean));
    const formats = new Set(ordered.map((m) => String(m.format ?? "")).filter(Boolean));
    const favSet = new Set(persisted.favoritesIds);

    const filtered = ordered.filter((m) => {
      const id = String(m.id);

      if (persisted.onlyFavorites && !favSet.has(id)) return false;
      if (persisted.kindFilter && String(m.kind ?? "") !== persisted.kindFilter) return false;
      if (persisted.formatFilter && String(m.format ?? "") !== persisted.formatFilter) return false;

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
  }, [enrichedMaps, localMaps, persisted]);

  // ==================== CALLBACKS THAT DEPEND ON FILTEREDMAPS ====================
  const selectIndex = useCallback((idx: number) => {
    setSelectedIndex(idx);
    const m = filteredMaps[idx];
    if (m) {
      setPersisted((p) => ({ ...p, selectedMapId: String(m.id) }));
    }
    setMapJsonData(null);
    setIframeError(null);
    setIframeLoading(true);
  }, [filteredMaps, setPersisted]);

  const toggleFavorite = useCallback((id: string) => {
    setPersisted((p) => {
      const set = new Set(p.favoritesIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...p, favoritesIds: Array.from(set) };
    });
  }, [setPersisted]);

  const copyToClipboard = useCallback(async (txt: string, label: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast({ title: t("copied"), description: label });
    } catch {
      toast({ title: t("copyFailed"), description: t("clipboardNotAvailable") });
    }
  }, [t, toast]);

  const handleReload = useCallback(() => {
    setIframeError(null);
    setIframeLoading(true);
    setIframeReloadKey((k) => k + 1);
  }, []);

  const handleResetView = useCallback(() => {
    sendToMap(iframeRef, { type: "MAP_COMMAND", command: "RESET_VIEW" });
    toast({ title: t("commandSent"), description: t("resetViewIfSupported") });
  }, [t, toast]);

  // ==================== USEEFFECT HOOKS ====================
  useEffect(() => {
    if (maps && maps.length > 0) {
      setLocalMaps(maps);
    }
  }, [maps]);

  useEffect(() => {
    if (localMaps.length > 0) {
      fetchAllMapContexts(localMaps);
    } else {
      setIsInitialLoading(false);
    }
  }, [localMaps, fetchAllMapContexts]);

  useEffect(() => {
    if (!hydrated || filteredMaps.length === 0 || isInitialLoading) return;

    if (persisted.selectedMapId) {
      const idx = filteredMaps.findIndex((m) => String(m.id) === persisted.selectedMapId);
      if (idx >= 0) {
        setSelectedIndex(idx);
      } else {
        setSelectedIndex(0);
      }
    } else {
      setSelectedIndex(0);
    }
  }, [hydrated, filteredMaps, persisted.selectedMapId, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) return;

    const active = filteredMaps[selectedIndex];
    if (active) {
      if (active.context) {
        setMapJsonData(active.context);
      } else {
        fetchMapJson(active).then(data => {
          if (data) {
            setMapJsonData(data);
            setEnrichedMaps(prev =>
              prev.map(m => m.id === active.id ? { ...m, context: data } : m)
            );
          }
        });
      }
    }
  }, [selectedIndex, filteredMaps, isInitialLoading, fetchMapJson]);

  // ==================== CUSTOM HOOKS ====================
  useMapNavigation({
    selectedIndex,
    maxIndex: filteredMaps.length - 1,
    onPrevious: () => selectIndex(Math.max(0, selectedIndex - 1)),
    onNext: () => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1)),
    onToggleHistory: () => setPickerOpen((v) => !v),
    onOpen: () => {
      const active = filteredMaps[selectedIndex];
      if (active?.api_full_url) {
        window.open(active.api_full_url, "_blank", "noreferrer");
      }
    },
    onReload: handleReload,
    onToggleFavorite: () => {
      const active = filteredMaps[selectedIndex];
      if (active) toggleFavorite(String(active.id));
    },
  });

  useMapMessages(onStationPick, (msg) => {
    toast({
      title: t("stationSelected"),
      description: `${t("station")} ${String(msg.station)}${
        msg.data != null ? ` · ${String(msg.data)}` : ""
      }`,
    });
  });

  // ==================== DERIVED VALUES ====================
  const active = filteredMaps[selectedIndex] as MapMetadata | undefined;
  const activeId = active ? String(active.id) : "";
  const isFav = active ? favoritesSet.has(activeId) : false;
  const href = active?.api_full_url ?? (active ? `${apiBase}/results/file/${runId}/${active.name}` : "");
  const isHtml = active?.format === "html";
  const displayName = active ? prettyMapName(String(active.name ?? "")) : "";
  const mapType = active ? getMapType(String(active.kind ?? ""), String(active.name ?? "")) : "";
  const instant = active ? extractInstantFromName(String(active.name ?? "")) : "";

  // Create the station click handler after we have displayName
  const handleStationClick = useCallback((stationId: number) => {
    if (onStationPick) {
      onStationPick({
        mapName: displayName,
        station: stationId,
        data: null
      });
    }
  }, [onStationPick, displayName]);

  // ==================== CONDITIONAL RETURNS ====================
  if (isInitialLoading) {
    return <MapsLoadingSkeleton />;
  }

  if (isLoadingContexts) {
    return (
      <div className="h-full flex flex-col">
        <div className="w-full h-[120vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
          <div className="h-14 border-b border-surface-3 bg-surface-2/50" />
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-4 text-center max-w-md px-4">
              <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-medium text-text-primary">
                Loading map metadata...
              </div>
              <div className="w-full bg-surface-2 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="text-xs text-text-secondary">
                {loadingProgress}% complete • {enrichedMaps.length} of {localMaps.length} maps loaded
              </div>
            </div>
          </div>
          <div className="h-12 border-t border-surface-3 bg-surface-2/50" />
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-xl font-semibold text-danger">{loadingError}</div>
        <p className="text-text-secondary">Please try refreshing the page</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

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

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
        <p className="text-muted-foreground">No map selected</p>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="h-full flex flex-col">
      <div className="w-full h-[120vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
        <MapHeader
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

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
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

          <div className="border-t border-surface-3 max-h-[30vh] overflow-y-auto">
            <MapConfiguration
              map={active}
              mapJson={mapJsonData}
            />
          </div>
        </div>

        <MapFooter
          displayName={displayName}
          isFavorite={isFav}
          onToggleFavorite={() => toggleFavorite(activeId)}
          onOpenPicker={() => setPickerOpen(true)}
        />
      </div>

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
        onUpdateFilters={(updates: any) => setPersisted((p) => ({ ...p, ...updates }))}
      />
    </div>
  );
}