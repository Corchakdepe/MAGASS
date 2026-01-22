"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

type BottomPanelProps = {
  barLeft?: React.ReactNode;
  barRight?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  leftOffsetPx?: number; // e.g. 256
  minHeight?: number; // px
  onHeightChange?: (h: number) => void;
};

export function BottomPanel({
  children,
  barLeft,
  barRight,
  defaultOpen = true,
  leftOffsetPx = 256,
  minHeight = 120,
  onHeightChange,
}: BottomPanelProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  const barHeight = 44;
  const safePadding = 16;

  const [viewportH, setViewportH] = useState<number>(
    typeof window === "undefined" ? 900 : window.innerHeight,
  );

  const [contentHeight, setContentHeight] = useState<number>(360);

  const maxHeight = useMemo(
    () => Math.max(minHeight, viewportH - barHeight - safePadding),
    [viewportH, barHeight, safePadding, minHeight],
  );

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setContentHeight((h) => Math.min(Math.max(h, minHeight), maxHeight));
  }, [maxHeight, minHeight]);

  const effectiveHeight = open ? barHeight + contentHeight : barHeight;

  useEffect(() => {
    onHeightChange?.(effectiveHeight);
  }, [effectiveHeight, onHeightChange]);

  const dragRef = useRef<{ dragging: boolean; startY: number; startH: number }>({
    dragging: false,
    startY: 0,
    startH: 0,
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dy = e.clientY - dragRef.current.startY;
      const next = dragRef.current.startH - dy;
      const clamped = Math.max(minHeight, Math.min(maxHeight, next));
      setContentHeight(Math.round(clamped));
    };

    const onUp = () => {
      dragRef.current.dragging = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [minHeight, maxHeight]);

  return (
      <div className="fixed bottom-4 right-4 w-[480px] rounded-xl overflow-hidden">
          {open && (
              <div
                  className="border-t border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel overflow-hidden">
                  {/* Drag handle */}
                  <div
                      className="h-2 cursor-row-resize bg-surface-2/70 hover:bg-surface-2 transition-colors"
                      onPointerDown={(e) => {
                          dragRef.current.dragging = true;
                          dragRef.current.startY = e.clientY;
                          dragRef.current.startH = contentHeight;
                          e.preventDefault();
                      }}
                  >
                      {/* subtle grip */}
                      <div className="h-full w-full flex items-center justify-center">
                          <div className="h-[3px] w-10 rounded-full bg-surface-3/80"/>
                      </div>
                  </div>

                  {/* Content */}
                  <div
                      className="overflow-auto bg-surface-1"
                      style={{height: contentHeight}}
                  >
                      {children}
                  </div>
              </div>
          )}

          {/* Bottom bar */}
          <div className="bg-surface-1/85 backdrop-blur-md shadow-mac-toolbar">

              <div className="h-[44px] px-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                      {barLeft}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                      {barRight}
                      <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-text-secondary hover:bg-surface-0/70"
                          onClick={() => setOpen((v) => !v)}
                      >
                          {open ? t('hide') : t('show')}
                      </Button>
                  </div>
              </div>
          </div>
      </div>
  );
}
