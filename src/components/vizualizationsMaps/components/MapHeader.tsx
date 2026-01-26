// src/components/visualizations/maps/components/MapHeader.tsx

"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPlus,
  MoreVertical,
  Star,
  StarOff,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useLanguage } from "@/contexts/LanguageContext";

interface MapHeaderProps {
  active: any;
  displayName: string;
  isFavorite: boolean;
  canPrev: boolean;
  canNext: boolean;
  selectedIndex: number;
  totalMaps: number;
  totalFiltered: number;
  href: string;
  isHtml: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onOpen: () => void;
  onReload: () => void;
  onCopyLink: () => void;
  onCopyName: () => void;
  onResetView: () => void;
}

export function MapHeader({
  active,
  displayName,
  isFavorite,
  canPrev,
  canNext,
  selectedIndex,
  totalMaps,
  totalFiltered,
  href,
  isHtml,
  onPrevious,
  onNext,
  onToggleFavorite,
  onOpen,
  onReload,
  onCopyLink,
  onCopyName,
  onResetView,
}: MapHeaderProps) {
  const { t } = useLanguage();

  return (
      <div className="shrink-0 px-4 py-3 border-b border-surface-3 bg-surface-1/92">
          <div className="flex items-start justify-between gap-3">
              {/* Title Info */}
              <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                      <div
                          className="text-sm font-semibold text-text-primary truncate"
                          title={displayName}
                      >
                          {displayName}
                      </div>
                      {isFavorite && (
                          <Badge className="shrink-0 bg-accent-soft text-accent border border-accent/25">
                              {t("favorite")}
                          </Badge>
                      )}
                  </div>

                  <div
                      className="mt-0.5 text-[11px] text-text-secondary truncate"
                      title={active.name}
                  >
                      {active.name}
                  </div>

                  <div className="mt-2 text-[11px] text-text-tertiary flex flex-wrap items-center gap-2">
            <span>
              {t("format")}: {String(active.format)} · {t("kind")}:{" "}
                {String(active.kind)}
            </span>
                      <Separator orientation="vertical" className="h-4 bg-surface-3"/>
                      <span>
              {selectedIndex + 1} / {totalFiltered} ({t("filtered")}) · {totalMaps}{" "}
                          ({t("total")})
            </span>
                  </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                  {/* Previous */}
                  <Button
                      variant="outline"
                      size="icon"
                      className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                      onClick={onPrevious}
                      disabled={!canPrev}
                      title={t("previousArrow")}
                  >
                      <ChevronLeft className="h-4 w-4 text-text-primary"/>
                  </Button>

                  {/* Open in New Tab */}
                  <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-surface-1 border border-surface-3 hover:bg-surface-0"
                      onClick={onOpen}
                      title={t("openInNewTabO")}
                      disabled={!href}
                  >
                      <MapPlus className="mr-2 h-4 w-4 text-text-primary"/>
                      {t("open")}
                  </Button>

                  {/* Next */}
                  <Button
                      variant="outline"
                      size="icon"
                      className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                      onClick={onNext}
                      disabled={!canNext}
                      title={t("nextArrow")}
                  >
                      <ChevronRight className="h-4 w-4 text-text-primary"/>
                  </Button>

                  {/* More Actions Menu */}
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button
                              variant="outline"
                              size="icon"
                              className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                              title={t("moreActions")}
                          >
                              <MoreVertical className="h-4 w-4 text-text-primary"/>
                          </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                          align="end"
                          className="w-56 bg-surface-1 border border-surface-3 shadow-mac-panel"
                      >
                          <DropdownMenuLabel className="text-xs text-text-secondary">
                              {t("mapActions")}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-surface-3"/>

                          <DropdownMenuItem onClick={onToggleFavorite} className="text-xs">
                              {isFavorite ? (
                                  <StarOff className="h-4 w-4 mr-2 text-text-tertiary"/>
                              ) : (
                                  <Star className="h-4 w-4 mr-2 text-text-tertiary"/>
                              )}
                              {isFavorite ? t("unfavorite") : t("favorite")} (F)
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={onCopyLink} className="text-xs" disabled={!href}>
                              <Copy className="h-4 w-4 mr-2 text-text-tertiary"/>
                              {t("copyLink")}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={onCopyName} className="text-xs">
                              <Copy className="h-4 w-4 mr-2 text-text-tertiary"/>
                              {t("copyDisplayName")}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-surface-3"/>

                          <DropdownMenuItem
                              className="text-xs"
                              onClick={onReload}
                              disabled={!isHtml || !href}
                          >
                              <RefreshCw className="h-4 w-4 mr-2 text-text-tertiary"/>
                              {t("reloadPreviewR")}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-surface-3"/>

                          <DropdownMenuItem className="text-xs" onClick={onResetView} disabled={!isHtml}>
                              <RefreshCw className="h-4 w-4 mr-2 text-text-tertiary"/>
                              {t("resetViewIframe")}
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          </div>
      </div>
  );
}
