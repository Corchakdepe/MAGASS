// components/graphs/GraphsHistorySheet.tsx
"use client";

import React from "react";
import {
  ChevronUp,
  Filter,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { GraphPersistedState } from "@/lib/analysis/graphs/hooks";
import { prettyGraphLabel } from "@/lib/analysis/graphs/hooks";

type GraphsHistorySheetProps = {
  displayName: string;
  isFav: boolean;
  activeId: string;
  pickerOpen: boolean;
  setPickerOpen: (open: boolean) => void;
  persisted: GraphPersistedState;
  setPersisted: React.Dispatch<React.SetStateAction<GraphPersistedState>>;
  filteredGraphs: any[];
  orderedGraphs: any[];
  selectedIndex: number;
  titlesById: Record<string, string>;
  favoritesSet: Set<string>;
  onSelectIndex: (idx: number) => void;
  onToggleFavorite: (id: string) => void;
};

export const GraphsHistorySheet: React.FC<GraphsHistorySheetProps> = ({
  displayName,
  isFav,
  activeId,
  pickerOpen,
  setPickerOpen,
  persisted,
  setPersisted,
  filteredGraphs,
  orderedGraphs,
  selectedIndex,
  titlesById,
  favoritesSet,
  onSelectIndex,
  onToggleFavorite,
}) => {
  return (
    <Card className="w-full border-brand-100 bg-brand-50/60">
      <CardContent className="py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">
              Selected graph
            </div>
            <div className="text-sm font-medium truncate text-brand-700">
              {displayName || "None"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isFav ? "default" : "outline"}
              size="sm"
              className={
                isFav
                  ? "shrink-0 bg-brand-300 text-brand-50 hover:bg-brand-500"
                  : "shrink-0 border-brand-100 hover:bg-brand-100"
              }
              onClick={() => activeId && onToggleFavorite(activeId)}
              title="Toggle favorite (F)"
            >
              <Star className="h-4 w-4 mr-2" />
              {isFav ? "Starred" : "Star"}
            </Button>

            <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-brand-100 hover:bg-brand-100"
                  title="Open history (H)"
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Choose graph
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="p-0">
                <div className="p-4 border-b border-brand-100 bg-brand-50/80">
                  <SheetHeader>
                    <SheetTitle className="text-brand-700">
                      Graphs history ({filteredGraphs.length} shown /{" "}
                      {orderedGraphs.length} total)
                    </SheetTitle>
                  </SheetHeader>
                </div>

                <div className="px-4 pb-3 space-y-3 bg-brand-50/60">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-700">
                        Search
                      </Label>
                      <div className="relative">
                        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="h-8 pl-8 text-xs border-brand-100 bg-background focus-visible:ring-brand-300 focus-visible:border-brand-300"
                          value={persisted.searchText}
                          onChange={(e) =>
                            setPersisted((p) => ({
                              ...p,
                              searchText: e.target.value,
                            }))
                          }
                          placeholder="name, kind, idâ€¦"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-brand-700">
                        Filters
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-brand-100 hover:bg-brand-100"
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
                              setPersisted((p) => ({
                                ...p,
                                onlyFavorites: Boolean(v),
                              }))
                            }
                          />
                          <span className="text-xs">Only favorites</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-brand-700">
                        Kind / Format
                      </Label>
                      <div className="flex gap-2">
                        <select
                          className="h-8 w-full rounded-md border border-brand-100 bg-background px-2 text-xs"
                          value={persisted.kindFilter}
                          onChange={(e) =>
                            setPersisted((p) => ({
                              ...p,
                              kindFilter: e.target.value,
                            }))
                          }
                        >
                          <option value="">All kinds</option>
                          {/* Options fed from parent via context or separate prop if needed */}
                        </select>

                        <select
                          className="h-8 w-full rounded-md border border-brand-100 bg-background px-2 text-xs"
                          value={persisted.formatFilter}
                          onChange={(e) =>
                            setPersisted((p) => ({
                              ...p,
                              formatFilter: e.target.value,
                            }))
                          }
                        >
                          <option value="">All formats</option>
                          {/* Same note as above */}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Shortcuts: â†/â†’ navigate Â· H history Â· F favorite
                  </div>
                </div>

                <div className="px-4 pb-4 bg-background">
                  <div className="max-h-[50vh] overflow-y-auto rounded-md border border-brand-100">
                    <ul className="divide-y">
                      {filteredGraphs.map((item: any, idx: number) => {
                        const id = String(item.id);
                        const listTitle =
                          titlesById[item.id] ??
                          item.meta?.title ??
                          prettyGraphLabel(item);
                        const selected = idx === selectedIndex;
                        const fav = favoritesSet.has(id);

                        return (
                          <li key={id}>
                            <button
                              type="button"
                              className={[
                                "w-full px-3 py-2 text-left hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                                selected ? "bg-brand-100" : "",
                              ].join(" ")}
                              onClick={() => {
                                onSelectIndex(idx);
                                setPickerOpen(false);
                              }}
                              title={String(item.name ?? "")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate text-brand-700">
                                    {listTitle}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {String(item.kind ?? "")} Â·{" "}
                                    {String(item.format ?? "")} Â· id {id}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {fav && (
                                    <Star className="h-4 w-4 text-brand-500" />
                                  )}

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onToggleFavorite(id);
                                    }}
                                    aria-label={
                                      fav ? "Unfavorite" : "Favorite"
                                    }
                                    title={
                                      fav ? "Unfavorite" : "Favorite"
                                    }
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};