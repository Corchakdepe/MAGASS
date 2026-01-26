// src/components/visualizations/maps/VisualizationMaps.tsx
"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapHeader } from "../components/MapHeader";
import { MapFooter } from "../components/MapFooter";
import { MapViewer } from "../components/MapViewer";
import { MapPicker } from "../components/MapPicker";
import { useMapPersistence } from "../hooks/useMapPersistence";
import { useMapNavigation } from "../hooks/useMapNavigation";
import { useMapMessages } from "../hooks/useMapMessages";
import { sendToMap } from "../utils/messaging";
import { prettyMapName } from "../utils/formatters";
import type { VisualizationMapsProps } from "../types";

export default function VisualizationMaps({
  runId,
  apiBase,
  maps,
  onStationPick,
}: VisualizationMapsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      setPersisted((p) => ({ ...p, selectedMapId: String(m.id) }));
    }
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

  const active = filteredMaps[selectedIndex];
  const activeId = active ? String(active.id) : "";
  const isFav = activeId ? favoritesSet.has(activeId) : false;
  const href = active?.api_full_url ?? (active?.url ? `${apiBase}${active.url}` : "");
  const isHtml = active?.format === "html";
  const displayName = prettyMapName(active?.name ?? "");

  // Keyboard navigation
  useMapNavigation({
    selectedIndex,
    maxIndex: filteredMaps.length - 1,
    onPrevious: () => selectIndex(Math.max(0, selectedIndex - 1)),
    onNext: () => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1)),
    onToggleHistory: () => setPickerOpen((v) => !v),
    onOpen: () => window.open(href, "_blank", "noreferrer"),
    onReload: handleReload,
    onToggleFavorite: () => active && toggleFavorite(activeId),
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
      <section className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold text-text-primary">
            {t("analyticsMapsCreator")}
          </div>
          <p className="text-xs text-text-secondary">{t("noMapResultsForRun")}</p>
        </div>
      </section>
    );
  }

  // No matches state - maps exist but filtered out
  if (!active) {
    return (
      <section className="h-full w-full flex items-center justify-center p-8">
        <div className="max-w-md space-y-3 text-center">
          <div className="text-sm font-semibold text-text-primary">
            {t("noMapsMatchFilters")}
          </div>
          <div className="text-xs text-text-secondary">
            {t("adjustSearchOrDisableFavorites")}
          </div>
          <Button
            variant="outline"
            className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
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
      </section>
    );
  }

  // Main render - map viewer with full height
  return (
  <div className="h-screen flex flex-col">
        <div
            className="w-full h-[90vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
           {/* Header - Fixed height */}
        <MapHeader
          active={active}
          displayName={displayName}
          isFavorite={isFav}
          canPrev={selectedIndex > 0}
          canNext={selectedIndex < filteredMaps.length - 1}
          selectedIndex={selectedIndex}
          totalMaps={orderedMaps.length}
          totalFiltered={filteredMaps.length}
          href={href}
          isHtml={isHtml}
          onPrevious={() => selectIndex(Math.max(0, selectedIndex - 1))}
          onNext={() => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1))}
          onToggleFavorite={() => toggleFavorite(activeId)}
          onOpen={() => window.open(href, "_blank", "noreferrer")}
          onReload={handleReload}
          onCopyLink={() => copyToClipboard(href, t("linkCopied"))}
          onCopyName={() => copyToClipboard(displayName, t("mapNameCopied"))}
          onResetView={handleResetView}
        />

        {/* Map Viewer - Flexible height (takes remaining space) */}
        <MapViewer
          isHtml={isHtml}
          href={href}
          displayName={displayName}
          activeId={activeId}
          iframeReloadKey={iframeReloadKey}
          iframeLoading={iframeLoading}
          iframeError={iframeError}
          iframeRef={iframeRef}
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

        {/* Footer - Fixed height */}
        <MapFooter
          displayName={displayName}
          isFavorite={isFav}
          onToggleFavorite={() => toggleFavorite(activeId)}
          onOpenPicker={() => setPickerOpen(true)}
        />
      </div>

      {/* Map Picker Sheet (slides from bottom) */}
      <MapPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        filteredMaps={filteredMaps}
        orderedMaps={orderedMaps}
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
