// src/components/visualizations/maps/components/MapFooter.tsx

"use client";

import React from "react";
import { ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MapFooterProps {
  displayName: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenPicker: () => void;
}

export function MapFooter({
  displayName,
  isFavorite,
  onToggleFavorite,
  onOpenPicker,
}: MapFooterProps) {
  const { t } = useLanguage();

  return (
      <div className="shrink-0 w-full border-t border-surface-3 bg-surface-1/85 p-3">
          <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                  <div className="text-[11px] text-text-secondary">{t("selectedMap")}</div>
                  <div className="text-xs font-semibold text-text-primary truncate">
                      {displayName}
                  </div>
              </div>

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
                      title={t("toggleFavoriteF")}
                  >
                      <Star className="h-4 w-4 mr-2"/>
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
                      <ChevronUp className="h-4 w-4 mr-2"/>
                      {t("chooseMap")}
                  </Button>
              </div>
          </div>
      </div>
  );
}
