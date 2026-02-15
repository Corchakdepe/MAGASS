// src/components/visualizations/components/GraphFooter.tsx

"use client";

import React from "react";
import { ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";

interface GraphFooterProps {
  active: any;
  meta: any;
  displayName: string;
  xLabel: string;
  yLabel: string;
  ySeries: any[];
  isFavorite: boolean;
  showAnalytics: boolean;
  onToggleFavorite: () => void;
  onOpenPicker: () => void;
}

export function GraphFooter({
  active,
  meta,
  displayName,
  xLabel,
  yLabel,
  ySeries,
  isFavorite,
  showAnalytics,
  onToggleFavorite,
  onOpenPicker,
}: GraphFooterProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full border-t border-surface-3 bg-surface-1/85 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Favorite Button */}
          <Button
            variant="outline"
            size="sm"
            className={[
              "shrink-0 bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
              isFavorite ? "text-accent border-accent/25 bg-accent-soft" : "",
            ].join(" ")}
            onClick={onToggleFavorite}
            title={t("toggleFavorite")}
          >
            <Star className="h-4 w-4 mr-2" />
            {isFavorite ? t("starred") : t("star")}
          </Button>

          {/* History Sheet Trigger */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 bg-surface-1 border border-surface-3 hover:bg-surface-0 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
            title={t("openHistoryH")}
            onClick={onOpenPicker}
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            {t("chooseGraph")}
          </Button>
        </div>
      </div>
    </div>
  );
}
