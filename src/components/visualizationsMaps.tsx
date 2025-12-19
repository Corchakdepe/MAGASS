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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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

const prettyMapName = (raw: string) => {
  let s = raw.replace(/^\d{8}_\d{6}_/, "");
  s = s.replace(/_/g, " ");
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");

  const m = s.match(/^(.+?)\s+instante(\d+)D(\d+)/);
  if (m) {
    const base = m[1].trim();
    const inst = m[2];
    const delta = m[3];
    const baseWithDe = base.replace(/^Mapa\s+/i, "Mapa de ");
    return `${baseWithDe} instante ${inst} Delta ${delta}`;
  }

  return s.trim().replace(/^Mapa\s+/i, "Mapa de ");
};

type VisualizationMapsProps = {
  runId: string;
  apiBase: string;
  maps: RawResultItem[];
  onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};

type PersistedState = {
  selectedMapId?: string;
  favoritesIds: string[];
  historyOpen?: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string; // "" = all
  formatFilter: string; // "" = all
};

function lsKey(runId: string) {
  return `viz_maps:${runId}`;
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default function VisualizationMaps({ runId, apiBase, maps, onStationPick }: VisualizationMapsProps) {
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
  }, [orderedMaps, persisted.searchText, persisted.onlyFavorites, persisted.kindFilter, persisted.formatFilter, favoritesSet]);

  // Selection index only (persist selection only on user actions)
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectIndex = (idx: number) => {
    setSelectedIndex(idx);
    const m = filteredMaps[idx];
    if (m) {
      const id = String(m.id);
      setPersisted((p) => (p.selectedMapId === id ? p : { ...p, selectedMapId: id }));
    }
  };

  // on runId / filter changes: choose initial index once (no ping-pong)
  useEffect(() => {
    if (!hydrated) return;

    if (!filteredMaps.length) {
      setSelectedIndex(0);
      return;
    }

    if (persisted.selectedMapId) {
      const idx = filteredMaps.findIndex((m) => String(m.id) === String(persisted.selectedMapId));
      if (idx >= 0) {
        setSelectedIndex(idx);
        return;
      }
    }

    setSelectedIndex(filteredMaps.length - 1);
  }, [hydrated, runId, filteredMaps, persisted.selectedMapId]);

  // iframe -> parent
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
        title: "Station selected",
        description: `Station ${String(msg.station)}${msg.data != null ? ` · ${String(msg.data)}` : ""}`,
      });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onStationPick, toast]);

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
      toast({ title: "Copied", description: label });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available." });
    }
  };

  // keyboard shortcuts
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
        const active = filteredMaps[selectedIndex];
        if (!active) return;
        const href = active.api_full_url ?? `${apiBase}${active.url}`;
        window.open(href, "_blank", "noreferrer");
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        setIframeError(null);
        setIframeLoading(true);
        setIframeReloadKey((k) => k + 1);
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        const active = filteredMaps[selectedIndex];
        if (!active) return;
        toggleFavorite(String(active.id));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredMaps, selectedIndex, apiBase]); // ok: selectIndex uses current filteredMaps

  if (!orderedMaps || orderedMaps.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Analytics Maps Creator</h2>
        <p className="text-xs text-muted-foreground">No map results found for this run.</p>
      </section>
    );
  }

  const active = filteredMaps[selectedIndex];
  if (!active) {
    return (
      <section className="w-full space-y-3 col-span-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">No maps match filters</CardTitle>
            <CardDescription>Adjust search/filters or disable “only favorites”.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button
              variant="outline"
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
              Reset filters
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const href = active.api_full_url ?? `${apiBase}${active.url}`;
  const isHtml = active.format === "html";
  const displayName = prettyMapName(active.name);

  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < filteredMaps.length - 1;

  const activeId = String(active.id);
  const isFav = favoritesSet.has(activeId);

  return (
    <section className="w-full space-y-3 col-span-full">
      <Card className="w-full h-[80vh] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-base truncate" title={displayName}>
                  {displayName}
                </CardTitle>
                {isFav && (
                  <Badge variant="secondary" className="shrink-0">
                    Favorite
                  </Badge>
                )}
              </div>

              <CardDescription className="truncate" title={active.name}>
                {active.name}
              </CardDescription>

              <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                <span>
                  Format: {String(active.format)} · Kind: {String(active.kind)}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  {selectedIndex + 1} / {filteredMaps.length} (filtered) · {orderedMaps.length} total
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => selectIndex(Math.max(0, selectedIndex - 1))}
                disabled={!canPrev}
                aria-label="Previous map"
                title="Previous (←)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(href, "_blank", "noreferrer")}
                title="Open in new tab (O)"
              >
                <MapPlus className="mr-2 h-4 w-4" />
                Open
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => selectIndex(Math.min(filteredMaps.length - 1, selectedIndex + 1))}
                disabled={!canNext}
                aria-label="Next map"
                title="Next (→)"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions" title="More actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Map actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => toggleFavorite(activeId)}>
                    {isFav ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                    {isFav ? "Unfavorite" : "Favorite"} (F)
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => copyToClipboard(href, "Link copied")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => copyToClipboard(displayName, "Map name copied")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy display name
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      setIframeError(null);
                      setIframeLoading(true);
                      setIframeReloadKey((k) => k + 1);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload preview (R)
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      sendToMap({ type: "MAP_COMMAND", command: "RESET_VIEW" });
                      toast({ title: "Command sent", description: "RESET_VIEW (if supported by iframe)" });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset view (iframe)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0">
          {isHtml ? (
            <div className="relative h-full w-full overflow-hidden rounded-md border bg-muted/20">
              {iframeLoading && (
                <div className="absolute inset-0 z-10 p-4">
                  <div className="h-full w-full rounded-md bg-background/60 backdrop-blur-sm border flex flex-col gap-3 p-4">
                    <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="flex-1 rounded bg-muted animate-pulse" />
                    <div className="h-8 w-28 rounded bg-muted animate-pulse" />
                    <div className="text-xs text-muted-foreground">Loading preview…</div>
                  </div>
                </div>
              )}

              {iframeError && (
                <div className="absolute inset-0 z-20 grid place-items-center p-4">
                  <div className="w-full max-w-md rounded-md border bg-background p-4 space-y-2">
                    <div className="text-sm font-medium">Preview failed</div>
                    <div className="text-xs text-muted-foreground break-words">{iframeError}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIframeError(null);
                          setIframeLoading(true);
                          setIframeReloadKey((k) => k + 1);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>

                      <Button variant="outline" onClick={() => window.open(href, "_blank", "noreferrer")}>
                        <MapPlus className="h-4 w-4 mr-2" />
                        Open
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
                  setIframeError("Iframe failed to load (network/CSP/content).");
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">This result is not HTML, so it can’t be previewed in an iframe.</p>
              <Button variant="outline" size="sm" className="w-fit" onClick={() => window.open(href, "_blank", "noreferrer")}>
                <MapPlus className="h-4 w-4 mr-2" />
                Open result
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Selected map</div>
              <div className="text-sm font-medium truncate">{displayName}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isFav ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => toggleFavorite(activeId)}
                title="Toggle favorite (F)"
              >
                <Star className="h-4 w-4 mr-2" />
                {isFav ? "Starred" : "Star"}
              </Button>

              <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0" title="Open history (H)">
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Choose map
                  </Button>
                </SheetTrigger>

                <SheetContent side="bottom" className="p-0">
                  <div className="p-4">
                    <SheetHeader>
                      <SheetTitle>
                        Maps history ({filteredMaps.length} shown / {orderedMaps.length} total)
                      </SheetTitle>
                    </SheetHeader>
                  </div>

                  <div className="px-4 pb-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Search</Label>
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="h-8 pl-8 text-xs"
                            value={persisted.searchText}
                            onChange={(e) => setPersisted((p) => ({ ...p, searchText: e.target.value }))}
                            placeholder="name, kind, id…"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Filters</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
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
                              onCheckedChange={(v) => setPersisted((p) => ({ ...p, onlyFavorites: Boolean(v) }))}
                            />
                            <span className="text-xs">Only favorites</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Kind / Format</Label>
                        <div className="flex gap-2">
                          <select
                            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                            value={persisted.kindFilter}
                            onChange={(e) => setPersisted((p) => ({ ...p, kindFilter: e.target.value }))}
                          >
                            <option value="">All kinds</option>
                            {allKinds.map((k) => (
                              <option key={k} value={k}>
                                {k}
                              </option>
                            ))}
                          </select>

                          <select
                            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                            value={persisted.formatFilter}
                            onChange={(e) => setPersisted((p) => ({ ...p, formatFilter: e.target.value }))}
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

                    <div className="text-[11px] text-muted-foreground">
                      Shortcuts: ←/→ navigate · H history · O open · F favorite · R reload
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="max-h-[50vh] overflow-y-auto rounded-md border">
                      <ul className="divide-y">
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
                                  "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  selected ? "bg-accent" : "",
                                ].join(" ")}
                                onClick={() => {
                                  selectIndex(idx);
                                  setPickerOpen(false);
                                }}
                                title={String(m.name)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{title}</div>
                                    <div className="text-[11px] text-muted-foreground truncate">
                                      {String(m.kind ?? "")} · {String(m.format ?? "")} · id {id}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {fav && <Star className="h-4 w-4 text-yellow-500" />}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(id);
                                      }}
                                      aria-label={fav ? "Unfavorite" : "Favorite"}
                                      title={fav ? "Unfavorite" : "Favorite"}
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
        </CardContent>
      </Card>
    </section>
  );
}
