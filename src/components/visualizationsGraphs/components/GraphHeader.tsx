// src/components/visualizations/components/GraphHeader.tsx

"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreVertical, Star, StarOff, Target,ScreenShare } from "lucide-react";
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
import { prettyGraphName } from "../utils/formatters";

interface GraphHeaderProps {
  active: any;
  displayName: string;
  isFavorite: boolean;
  canPrev: boolean;
  canNext: boolean;
  selectedIndex: number;
  totalGraphs: number;
  totalFiltered: number;
  showAnalytics: boolean;
  visualType: "auto" | "bar" | "line" | "area";
  onPrevious: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onToggleAnalytics: () => void;
  onOpenJSON: () => void;
  onVisualTypeChange: (type: "auto" | "bar" | "line" | "area") => void;
}

export function GraphHeader({
  active,
  displayName,
  isFavorite,
  canPrev,
  canNext,
  selectedIndex,
  totalGraphs,
  totalFiltered,
  showAnalytics,
  visualType,
  onPrevious,
  onNext,
  onToggleFavorite,
  onToggleAnalytics,
  onOpenJSON,
  onVisualTypeChange,
}: GraphHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="px-4 py-3 border-b border-surface-3 bg-surface-1/92">
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
          <div className="mt-2 text-[11px] text-text-tertiary flex flex-wrap items-center gap-2">
            <span>
              {selectedIndex + 1} / {totalFiltered} ({t("filtered")}) ·{" "}
              {totalGraphs} ({t("total")})
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
            <ChevronLeft className="h-4 w-4 text-text-primary" />
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
            <ChevronRight className="h-4 w-4 text-text-primary" />
          </Button>

          {/* Chart Type Selector */}
          <select
            className="h-8 w-[8.5rem] rounded-md border border-surface-3 bg-surface-1 px-2 text-xs text-text-primary"
            value={visualType}
            onChange={(e) =>
              onVisualTypeChange(e.target.value as "auto" | "bar" | "line" | "area")
            }
            title={t("chartStyle")}
          >
            <option value="auto">{t("autoMeta")}</option>
            <option value="bar">{t("bar")}</option>
            <option value="line">{t("line")}</option>
            <option value="area">{t("area")}</option>
          </select>

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
              >
                <MoreVertical className="h-4 w-4 text-text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-surface-1 border border-surface-3 shadow-mac-panel"
            >
              <DropdownMenuLabel className="text-xs text-text-secondary">
                {t("graphActions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-surface-3" />
              <DropdownMenuItem onClick={onToggleFavorite} className="text-xs">
                {isFavorite ? (
                  <StarOff className="h-4 w-4 mr-2 text-text-tertiary" />
                ) : (
                  <Star className="h-4 w-4 mr-2 text-text-tertiary" />
                )}
                {isFavorite ? t("unfavorite") : t("favorite")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenJSON} className="text-xs">
                <ScreenShare className="h-4 w-4 mr-2 text-text-tertiary"></ScreenShare>
                  {t("openJSON")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-surface-3" />
              <DropdownMenuItem onClick={onToggleAnalytics} className="text-xs">
                <Target className="h-4 w-4 mr-2 text-text-tertiary" />
                {showAnalytics ? t("hideAnalytics") : t("showAnalytics")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
