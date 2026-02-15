// src/components/visualizations/maps/VisualizationMaps.tsx

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  buildMapJsonUrl
} from "../utils/mapUtils";
import type {
  VisualizationMapsProps,
  MapMetadata,
  MapContext,
  RawResultItem
} from "../types";
import {API_BASE} from "@/lib/analysis/constants";

export default function VisualizationMaps({
  runId,
  apiBase,
  maps,
  onStationPick,
}: VisualizationMapsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'config'>('map'); // Add view mode state
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mapJsonData, setMapJsonData] = useState<MapContext | null>(null);

  const { persisted, setPersisted, hydrated } = useMapPersistence(runId, pickerOpen);

  // Filter and sort maps
  const { orderedMaps, filteredMaps, allKinds, allFormats, favoritesSet } = useMemo(() => {
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
  }, [maps, persisted]);

  // Navigation
  const selectIndex = (idx: number) => {
    setSelectedIndex(idx);
    const m = filteredMaps[idx];
    if (m) {
      setPersisted((p) => ({ ...p, selectedMapId: String(m.id) }));
    }
    setMapJsonData(null);
    setIframeError(null);
    setIframeLoading(true);
    setViewMode('map'); // Reset to map view when changing maps
  };

  const toggleFavorite = (id: string) => {
    setPersisted((p) => {
      const set = new Set(p.favoritesIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...p, favoritesIds: Array.from(set) };
    });
  };

  const copyToClipboard = async (txt: string, label: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast({ title: t("copied"), description: label });
    } catch {
      toast({ title: t("copyFailed"), description: t("clipboardNotAvailable") });
    }
  };

  const handleReload = () => {
    setIframeError(null);
    setIframeLoading(true);
    setIframeReloadKey((k) => k + 1);
  };

  const handleResetView = () => {
    sendToMap(iframeRef, { type: "MAP_COMMAND", command: "RESET_VIEW" });
    toast({ title: t("commandSent"), description: t("resetViewIfSupported") });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'map' ? 'config' : 'map');
  };

  // Fetch companion JSON file
  const fetchMapJson = async (map: RawResultItem) => {
    if (!map?.name) return;

    const baseName = map.name.replace(/\.(html|png|mp4)$/, '');
    const jsonFilename = `${baseName}.json`;
    const jsonUrl = `${API_BASE}/results/file/${runId}/${jsonFilename}`;

    try {
      const response = await fetch(jsonUrl);
      if (response.ok) {
        const data = await response.json();
        setMapJsonData(data);
      }
    } catch (error) {
      console.error("Failed to fetch map JSON:", error);
    }
  };

  // Sync selected index with persisted state
  useEffect(() => {
    if (!hydrated || filteredMaps.length === 0) return;

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
  }, [hydrated, filteredMaps, persisted.selectedMapId]);

  // Fetch JSON when active map changes
  useEffect(() => {
    if (filteredMaps[selectedIndex]) {
      fetchMapJson(filteredMaps[selectedIndex]);
    }
  }, [selectedIndex, filteredMaps]);

  // Keyboard navigation
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

  // PostMessage handling
  useMapMessages(onStationPick, (msg) => {
    toast({
      title: t("stationSelected"),
      description: `${t("station")} ${String(msg.station)}${
        msg.data != null ? ` · ${String(msg.data)}` : ""
      }`,
    });
  });

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

  // No matches state
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

  // Get active map
  const active = filteredMaps[selectedIndex] as MapMetadata;
  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-8">
        <p className="text-muted-foreground">No map selected</p>
      </div>
    );
  }

  const activeId = String(active.id);
  const isFav = favoritesSet.has(activeId);
  const href = active.api_full_url ?? `${apiBase}/results/file/${runId}/${active.name}`;

  const isHtml = active.format === "html";
  const displayName = prettyMapName(String(active.name ?? ""));
  const mapType = getMapType(String(active.kind ?? ""), String(active.name ?? ""));
  const instant = extractInstantFromName(String(active.name ?? ""));

  // Wrap onStationPick to handle the expected signature
  const handleStationClick = (stationId: number) => {
    if (onStationPick) {
      onStationPick({
        mapName: displayName,
        station: stationId,
        data: null
      });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
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
          onToggleViewMode={toggleViewMode}
          viewMode={viewMode}
        />

        {/* Content area that switches between MapViewer and MapConfiguration */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'map' ? (
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
          ) : (
            <div className="h-full overflow-y-auto overflow-x-hidden p-4">
              <MapConfiguration
                map={active}
                mapJson={mapJsonData}
              />
            </div>
          )}
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