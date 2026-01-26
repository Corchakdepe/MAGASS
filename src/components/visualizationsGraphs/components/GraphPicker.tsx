// src/components/visualizations/components/GraphPicker.tsx

"use client";

import React from "react";
import { Search, Filter, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { prettyGraphName } from "../utils/formatters";
import type { PersistedState } from "../types";

interface GraphPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredGraphs: any[];
  orderedGraphs: any[];
  selectedIndex: number;
  persisted: PersistedState;
  setPersisted: React.Dispatch<React.SetStateAction<PersistedState>>;
  favoritesSet: Set<string>;
  allKinds: string[];
  allFormats: string[];
  onSelectIndex: (index: number) => void;
  onToggleFavorite: (id: string) => void;
}

export function GraphPicker({
  open,
  onOpenChange,
  filteredGraphs,
  orderedGraphs,
  selectedIndex,
  persisted,
  setPersisted,
  favoritesSet,
  allKinds,
  allFormats,
  onSelectIndex,
  onToggleFavorite,
}: GraphPickerProps) {
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 bg-surface-1 border-t border-surface-3"
      >
        {/* History Panel Header */}
        <div className="p-4 border-b border-surface-3 bg-surface-1/92 backdrop-blur-md">
          <SheetHeader>
            <SheetTitle className="text-sm text-text-primary">
              {t("graphsHistory")} · {filteredGraphs.length} {t("shown")} /{" "}
              {orderedGraphs.length} {t("total")}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 space-y-3 border-b border-surface-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                {t("search")}
              </Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <Input
                  className="h-8 pl-8 text-xs bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                  value={persisted.searchText}
                  onChange={(e) =>
                    setPersisted((p) => ({ ...p, searchText: e.target.value }))
                  }
                  placeholder={t("searchPlaceholder")}
                />
              </div>
            </div>

            {/* Filters Controls */}
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                {t("filters")}
              </Label>
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
                  {t("reset")}
                </Button>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={persisted.onlyFavorites}
                    onCheckedChange={(v) =>
                      setPersisted((p) => ({ ...p, onlyFavorites: Boolean(v) }))
                    }
                    className="border-surface-3 data-[state=checked]:bg-accent data-[state=checked]:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/25"
                  />
                  <span className="text-xs text-text-secondary">
                    {t("onlyFavorites")}
                  </span>
                </div>
              </div>
            </div>

            {/* Kind & Format Selectors */}
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                {t("kindFormat")}
              </Label>
              <div className="flex gap-2">
                <select
                  className="h-8 w-full rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                  value={persisted.kindFilter}
                  onChange={(e) =>
                    setPersisted((p) => ({ ...p, kindFilter: e.target.value }))
                  }
                >
                  <option value="">{t("allKinds")}</option>
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
                    setPersisted((p) => ({ ...p, formatFilter: e.target.value }))
                  }
                >
                  <option value="">{t("allFormats")}</option>
                  {allFormats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-text-tertiary">{t("shortcuts")}</div>
        </div>

        {/* Graph List */}
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
                        "w-full px-3 py-2 text-left transition-colors hover:bg-surface-0/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                        selected ? "bg-accent-soft" : "",
                      ].join(" ")}
                      onClick={() => {
                        onSelectIndex(idx);
                        onOpenChange(false);
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
                            {String(m.kind ?? "")} · {String(m.format ?? "")} · {id}
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
                              onToggleFavorite(id);
                            }}
                            aria-label={fav ? t("unfavorite") : t("favorite")}
                            title={fav ? t("unfavorite") : t("favorite")}
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
  );
}

