"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
  <div
    className="fixed bottom-0 right-0 z-50"
    style={{ left: leftOffsetPx }}
  >
    {open && (
      <div className="border-t border-brand-100 bg-brand-50/80">
        {/* Drag handle */}
        <div
          className="h-2 cursor-row-resize bg-brand-100/70 hover:bg-brand-300/70 transition-colors"
          onPointerDown={(e) => {
            dragRef.current.dragging = true;
            dragRef.current.startY = e.clientY;
            dragRef.current.startH = contentHeight;
            e.preventDefault();
          }}
        />

        {/* Content */}
        <div
          className="overflow-auto bg-card"
          style={{ height: contentHeight }}
        >
          {children}
        </div>
      </div>
    )}

    {/* Bottom bar */}
    <div className="border-t border-brand-100 bg-brand-50/80">
      <div className="h-[44px] px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {barLeft}
        </div>
        <div className="flex items-center gap-2">
          {barRight}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-brand-700 hover:bg-brand-100/60"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "Show"}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

}