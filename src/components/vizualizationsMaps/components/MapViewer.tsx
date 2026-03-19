// src/components/visualizations/maps/components/MapViewer.tsx

"use client";

import React from "react";
import { RefreshCw, MapPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MapViewerProps {
  isHtml: boolean;
  href: string;
  displayName: string;
  activeId: string;
  iframeReloadKey: number;
  iframeLoading: boolean;
  iframeError: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onIframeLoad: () => void;
  onIframeError: () => void;
  onRetry: () => void;
  onOpen: () => void;
}

export function MapViewer({
  isHtml,
  href,
  displayName,
  activeId,
  iframeReloadKey,
  iframeLoading,
  iframeError,
  iframeRef,
  onIframeLoad,
  onIframeError,
  onRetry,
  onOpen,
}: MapViewerProps) {
  const { t } = useLanguage();

  if (!isHtml) {
    return (
      <div className="flex-1 overflow-hidden p-3">
        <div className="h-full w-full overflow-hidden rounded-md border border-surface-3 bg-surface-0/60 flex items-center justify-center p-8">
          <div className="space-y-2 text-center">
            <p className="text-xs text-text-secondary">{t("resultNotHTMLNoPreview")}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit bg-surface-1 border border-surface-3 hover:bg-surface-0"
              onClick={onOpen}
              disabled={!href}
            >
              <MapPlus className="h-4 w-4 mr-2" />
              {t("openResult")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden p-3 h-full w-full">
      <div className="relative h-full w-full overflow-hidden rounded-md border border-surface-3 bg-surface-0/60">
        {/* Loading State */}
        {iframeLoading && (
          <div className="absolute inset-0 z-10 p-4">
            <div className="h-full w-full rounded-md bg-surface-1/70 backdrop-blur-sm border border-surface-3 flex flex-col gap-3 p-4">
              <div className="h-4 w-1/3 rounded bg-surface-2 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-surface-2 animate-pulse" />
              <div className="flex-1 rounded bg-surface-2 animate-pulse" />
              <div className="h-8 w-28 rounded bg-surface-2 animate-pulse" />
              <div className="text-xs text-text-secondary">{t("loadingPreview")}</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {iframeError && (
          <div className="absolute inset-0 z-20 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-md border border-surface-3 bg-surface-1 p-4 space-y-2 shadow-mac-panel">
              <div className="text-sm font-semibold text-text-primary">
                {t("previewFailed")}
              </div>
              <div className="text-xs text-text-secondary break-words">{iframeError}</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t("retry")}
                </Button>

                <Button
                  variant="outline"
                  className="bg-surface-1 border border-surface-3 hover:bg-surface-0"
                  onClick={onOpen}
                  disabled={!href}
                >
                  <MapPlus className="h-4 w-4 mr-2" />
                  {t("open")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          key={`${activeId}:${iframeReloadKey}`}
          ref={iframeRef}
          src={href}
          className="h-full w-full"
          loading="lazy"
          title={displayName}
          onLoad={onIframeLoad}
          onError={onIframeError}
        />
      </div>
    </div>
  );
}
