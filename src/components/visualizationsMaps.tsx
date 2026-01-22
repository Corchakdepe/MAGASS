// components/visualization-maps.tsx
"use client";

import type { RawResultItem } from "@/components/main-content";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPlus,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Copy,
  RefreshCw,
  MoreVertical,
  Search,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { safeParse } from "@/lib/analysis/parsers";
import { lsKey, prettyMapName } from "@/lib/analysis/maps/builders";
import { VisualizationMapsProps, PersistedState } from "@/lib/analysis/maps/types";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VisualizationMaps({ runId, apiBase, maps, onStationPick }: VisualizationMapsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);

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

  const orderedMaps = useMemo(() => {
    const copy = [...(maps ?? [])];
    copy.sort((a, b) => String(a.created ?? "").localeCompare(String(b.created ?? "")));
    return copy;
  }, [maps]);

  const allKinds = useMemo(() => {
    const s = new Set<string>();
    orderedMaps.forEach((m) => s.add(String(m.kind ?? "")));
    return Array.from(s).filter(Boolean).sort();
  }, [orderedMaps]);

  const allFormats = useMemo(() => {
    const s = new Set<string>();
    orderedMaps.forEach((m) => s.add(String(m.format ?? "")));
    return Array.from(s).filter(Boolean).sort();
  }, [orderedMaps]);

  const favoritesSet = useMemo(() => new Set(persisted.favoritesIds), [persisted.favoritesIds]);

  const filteredMaps = useMemo(() => {
    const q = persisted.searchText.trim().toLowerCase();

    return orderedMaps.filter((m) => {
      const id = String(m.id);
      if (persisted.onlyFavorites && !favoritesSet.has(id)) return false;
      if (persisted.kindFilter && String(m.kind ?? "") !== persisted.kindFilter) return false;
      if (persisted.formatFilter && String(m.format ?? "") !== persisted.formatFilter) return false;

      if (!q) return true;

      const name = String(m.name ?? "").toLowerCase();
      const pretty = prettyMapName(String(m.name ?? "")).toLowerCase();
      const kind = String(m.kind ?? "").toLowerCase();
      return name.includes(q) || pretty.includes(q) || kind.includes(q) || id.includes(q);
    });
  }, [
    orderedMaps,
    persisted.searchText,
    persisted.onlyFavorites,
    persisted.kindFilter,
    persisted.formatFilter,
    favoritesSet,
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectIndex = (idx: number) => {
    setSelectedIndex(idx);
    const m = filteredMaps[idx];
    if (m) {
      const id = String(m.id);
      setPersisted((p) => (p.selectedMapId === id ? p : { ...p, selectedMapId: id }));
    }
  };

  const sendToMap = (message: any) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(message, "*");
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
      toast({ title: t('copied'), description: label });
    } catch {
      toast({ title: t('copyFailed'), description: t('clipboardNotAvailable') });
    }
  };

  // --------- SAFE "active" DERIVATIONS (no early return!) ----------
  const active = filteredMaps[selectedIndex] as RawResultItem | undefined;

  const activeId = active ? String(active.id) : "";
  const isFav = activeId ? favoritesSet.has(activeId) : false;

  const href =
    active?.api_full_url ??
    (active?.url ? `${apiBase}${active.url}` : "");

  const isHtml = active?.format === "html";
  const displayName = prettyMapName(active?.name ?? "");

  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < filteredMaps.length - 1;

  // -------------------- EFFECTS (must always run) --------------------
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
        if (selectedIndex < filteredMaps.length - 1) selectIndex(selectedIndex + 1);
      }
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        setPickerOpen((v) => !v);
      }
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        const a = filteredMaps[selectedIndex];
        if (!a) return;
        const link = a.api_full_url ?? `${apiBase}${a.url}`;
        window.open(link, "_blank", "noreferrer");
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setIframeError(null);
        setIframeLoading(true);
        setIframeReloadKey((k) => k + 1);
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        const a = filteredMaps[selectedIndex];
        if (!a) return;
        toggleFavorite(String(a.id));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredMaps, selectedIndex, apiBase]);

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
      setPickerOpen(Boolean(saved.historyOpen));
    } else {
      setPersisted((p) => ({ ...p, favoritesIds: [] }));
      setPickerOpen(false);
    }
    setHydrated(true);
  }, [runId]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(lsKey(runId), JSON.stringify({ ...persisted, historyOpen: pickerOpen }));
  }, [persisted, pickerOpen, hydrated, runId]);

  useEffect(() => {
    if (!hydrated) return;

    if (filteredMaps.length === 0) {
      setSelectedIndex(0);
      return;
    }

    // Clamp when filters change (prevents out-of-range)
    setSelectedIndex((i) => Math.min(i, filteredMaps.length - 1));

    if (persisted.selectedMapId) {
      const idx = filteredMaps.findIndex((m) => String(m.id) === String(persisted.selectedMapId));
      if (idx >= 0) setSelectedIndex(idx);
    }
  }, [hydrated, filteredMaps, persisted.selectedMapId]);

  useEffect(() => {
    const handler = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || (msg.type !== "MAPSTATIONCLICK" && msg.type !== "MAP_STATION_CLICK")) return;

      onStationPick?.({
        mapName: msg.mapName,
        station: Number(msg.station),
        data: msg.data ?? null,
      });

      toast({
        title: t('stationSelected'),
        description: `${t('station')} ${String(msg.station)}${msg.data != null ? ` · ${String(msg.data)}` : ""}`,
      });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onStationPick, toast, t]);

  // -------------------- OTHER EARLY RETURN (unchanged) --------------------
  if (!orderedMaps || orderedMaps.length === 0) {
    return (
      <section className="space-y-2">
        <div className="text-sm font-semibold text-text-primary">{t('analyticsMapsCreator')}</div>
        <p className="text-xs text-text-secondary">{t('noMapResultsForRun')}</p>
      </section>
    );
  }

  // -------------------- RENDER --------------------
  return (
    <section className="w-full space-y-3">
      {!active ? (
        <div className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-4">
          <div className="text-sm font-semibold text-text-primary">{t('noMapsMatchFilters')}</div>
          <div className="mt-1 text-xs text-text-secondary">
            {t('adjustSearchOrDisableFavorites')}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
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
              {t('resetFilters')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* MAIN VIEW PANEL (no Card) */}
          <div className="w-full h-[80vh] flex flex-col rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
            {/* Header bar */}
            <div className="px-4 py-3 border-b border-surface-3 bg-surface-1/92">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate" title={displayName}>
                      {displayName}
                    </div>
                    {isFav && (
                      <Badge className="shrink-0 bg-accent-soft text-accent border border-accent/25">
                        {t('favorite')}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-0.5 text-[11px] text-text-secondary truncate" title={active.name}>
                    {active.name}
                  </div>

                  <div className="mt-2 text-[11px] text-text-tertiary flex flex-wrap items-center gap-2">
                    <span>
                      {t('format')}: {String(active.format)} · {t('kind')}: {String(active.kind)}
                    </span>
                    <Separator orientation="vertical" className="h-4 bg-surface-3" />
                    <span>
                      {selectedIndex + 1} / {filteredMaps.length} ({t('filtered')}) · {orderedMaps.length} {t('total')}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    onClick={() => selectIndex(Math.max(0, selectedIndex - 1))}
                    disabled={!canPrev}
                    aria-label={t('previousMap')}
                    title={t('previousArrow')}
                  >
                    <ChevronLeft className="h-4 w-4 text-text-primary" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    onClick={() => window.open(href, "_blank", "noreferrer")}
                    title={t('openInNewTabO')}
                    disabled={!href}
                  >
                    <MapPlus className="mr-2 h-4 w-4 text-text-primary" />
                    {t('open')}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                    onClick={() => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1))}
                    disabled={!canNext}
                    aria-label={t('nextMap')}
                    title={t('nextArrow')}
                  >
                    <ChevronRight className="h-4 w-4 text-text-primary" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                        aria-label={t('moreActions')}
                        title={t('moreActions')}
                      >
                        <MoreVertical className="h-4 w-4 text-text-primary" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-surface-1 border border-surface-3 shadow-mac-panel"
                    >
                      <DropdownMenuLabel className="text-xs text-text-secondary">{t('mapActions')}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-surface-3" />

                      <DropdownMenuItem onClick={() => toggleFavorite(activeId)} className="text-xs">
                        {isFav ? (
                          <StarOff className="h-4 w-4 mr-2 text-text-tertiary" />
                        ) : (
                          <Star className="h-4 w-4 mr-2 text-text-tertiary" />
                        )}
                        {isFav ? t('unfavorite') : t('favorite')} (F)
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => copyToClipboard(href, t('linkCopied'))}
                        className="text-xs"
                        disabled={!href}
                      >
                        <Copy className="h-4 w-4 mr-2 text-text-tertiary" />
                        {t('copyLink')}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => copyToClipboard(displayName, t('mapNameCopied'))} className="text-xs">
                        <Copy className="h-4 w-4 mr-2 text-text-tertiary" />
                        {t('copyDisplayName')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-surface-3" />

                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => {
                          setIframeError(null);
                          setIframeLoading(true);
                          setIframeReloadKey((k) => k + 1);
                        }}
                        disabled={!isHtml || !href}
                      >
                        <RefreshCw className="h-4 w-4 mr-2 text-text-tertiary" />
                        {t('reloadPreviewR')}
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-surface-3" />

                      <DropdownMenuItem
                        className="text-xs"
                        onClick={() => {
                          sendToMap({ type: "MAP_COMMAND", command: "RESET_VIEW" });
                          toast({ title: t('commandSent'), description: t('resetViewIfSupported') });
                        }}
                        disabled={!isHtml}
                      >
                        <RefreshCw className="h-4 w-4 mr-2 text-text-tertiary" />
                        {t('resetViewIframe')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Viewer */}
            {isHtml ? (
              <div className="relative h-full w-full overflow-hidden rounded-md border border-surface-3 bg-surface-0/60">
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 p-4">
                    <div className="h-full w-full rounded-md bg-surface-1/70 backdrop-blur-sm border border-surface-3 flex flex-col gap-3 p-4">
                      <div className="h-4 w-1/3 rounded bg-surface-2 animate-pulse" />
                      <div className="h-3 w-2/3 rounded bg-surface-2 animate-pulse" />
                      <div className="flex-1 rounded bg-surface-2 animate-pulse" />
                      <div className="h-8 w-28 rounded bg-surface-2 animate-pulse" />
                      <div className="text-xs text-text-secondary">{t('loadingPreview')}</div>
                    </div>
                  </div>
                )}

                {iframeError && (
                  <div className="absolute inset-0 z-20 grid place-items-center p-4">
                    <div className="w-full max-w-md rounded-md border border-surface-3 bg-surface-1 p-4 space-y-2 shadow-mac-panel">
                      <div className="text-sm font-semibold text-text-primary">{t('previewFailed')}</div>
                      <div className="text-xs text-text-secondary break-words">{iframeError}</div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                          onClick={() => {
                            setIframeError(null);
                            setIframeLoading(true);
                            setIframeReloadKey((k) => k + 1);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('retry')}
                        </Button>

                        <Button
                          variant="outline"
                          className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                          onClick={() => window.open(href, "_blank", "noreferrer")}
                          disabled={!href}
                        >
                          <MapPlus className="h-4 w-4 mr-2" />
                          {t('open')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <iframe
                  key={`${activeId}:${iframeReloadKey}`}
                  ref={iframeRef}
                  src={href}
                  className="h-full w-full"
                  loading="lazy"
                  title={displayName}
                  onLoad={() => {
                    setIframeLoading(false);
                    setIframeError(null);
                  }}
                  onError={() => {
                    setIframeLoading(false);
                    setIframeError(t('iframeFailedToLoad'));
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-text-secondary">
                  {t('resultNotHTMLNoPreview')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit bg-surface-1 border border-surface-3 hover:bg-surface-0"
                  onClick={() => window.open(href, "_blank", "noreferrer")}
                  disabled={!href}
                >
                  <MapPlus className="h-4 w-4 mr-2" />
                  {t('openResult')}
                </Button>
              </div>
            )}
          </div>

          {/* FOOTER PANEL (no Card) */}
          <div className="w-full rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] text-text-secondary">{t('selectedMap')}</div>
                <div className="text-xs font-semibold text-text-primary truncate">{displayName}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={[
                    "shrink-0",
                    "bg-surface-1 border border-surface-3 hover:bg-surface-0",
                    "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
                    isFav ? "text-accent border-accent/25 bg-accent-soft" : "",
                  ].join(" ")}
                  onClick={() => toggleFavorite(activeId)}
                  title={t('toggleFavoriteF')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {isFav ? t('starred') : t('star')}
                </Button>

                <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                      title={t('openHistoryH')}
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      {t('chooseMap')}
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="bottom" className="p-0 bg-surface-1 border-t border-surface-3">
                    <div className="p-4 border-b border-surface-3 bg-surface-1/92 backdrop-blur-md">
                      <SheetHeader>
                        <SheetTitle className="text-sm text-text-primary">
                          {t('mapsHistory')} ({filteredMaps.length} {t('shown')} / {orderedMaps.length} {t('total')})
                        </SheetTitle>
                      </SheetHeader>
                    </div>

                    <div className="px-4 pb-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-text-secondary">{t('search')}</Label>
                          <div className="relative">
                            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <Input
                              className="h-8 pl-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                              value={persisted.searchText}
                              onChange={(e) => setPersisted((p) => ({ ...p, searchText: e.target.value }))}
                              placeholder={t('searchPlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-text-secondary">{t('filters')}</Label>
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
                              {t('reset')}
                            </Button>

                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={persisted.onlyFavorites}
                                onCheckedChange={(v) => setPersisted((p) => ({ ...p, onlyFavorites: Boolean(v) }))}
                                className="border-surface-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/25"
                              />
                              <span className="text-xs text-text-secondary">{t('onlyFavorites')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] text-text-secondary">{t('kindFormat')}</Label>
                          <div className="flex gap-2">
                            <select
                              className="h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                              value={persisted.kindFilter}
                              onChange={(e) => setPersisted((p) => ({ ...p, kindFilter: e.target.value }))}
                            >
                              <option value="">{t('allKinds')}</option>
                              {allKinds.map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>

                            <select
                              className="h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                              value={persisted.formatFilter}
                              onChange={(e) => setPersisted((p) => ({ ...p, formatFilter: e.target.value }))}
                            >
                              <option value="">{t('allFormats')}</option>
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
                        {t('mapsShortcuts')}
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <div className="max-h-[50vh] overflow-y-auto rounded-md border border-surface-3 bg-surface-1">
                        <ul className="divide-y divide-surface-3">
                          {filteredMaps.map((m, idx) => {
                            const title = prettyMapName(m.name);
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
                                        {String(m.kind ?? "")} · {String(m.format ?? "")} · id {id}
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
                                          toggleFavorite(id);
                                        }}
                                        aria-label={fav ? t('unfavorite') : t('favorite')}
                                        title={fav ? t('unfavorite') : t('favorite')}
                                      >
                                        {fav ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
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
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
