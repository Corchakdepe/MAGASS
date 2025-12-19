"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type BottomPanelProps = {
  barLeft?: React.ReactNode;
  barRight?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;

  // Sidebar offset so the panel doesn't go under it
  leftOffsetPx?: number; // e.g. 256

  // Keep it usable
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
  const safePadding = 16; // breathing room at top of viewport

  const [viewportH, setViewportH] = useState<number>(
    typeof window === "undefined" ? 900 : window.innerHeight,
  );

  // Content height (resized by user)
  const [contentHeight, setContentHeight] = useState<number>(360);

  // Max allowed = viewport - bottom bar - padding
  const maxHeight = useMemo(
    () => Math.max(minHeight, viewportH - barHeight - safePadding),
    [viewportH, barHeight, safePadding, minHeight],
  );

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // When viewport shrinks, keep the panel inside it
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

      // dragging up => increase height
      const dy = e.clientY - dragRef.current.startY;
      const next = dragRef.current.startH - dy;

      // "No limits" except: keep inside viewport and not negative
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
      style={{ left: leftOffsetPx }} // key: prevents sidebar overlap
    >
      {open && (
        <div className="border-t bg-background">
          {/* Drag handle */}
          <div
            className="h-2 cursor-row-resize bg-muted/40 hover:bg-muted"
            onPointerDown={(e) => {
              dragRef.current.dragging = true;
              dragRef.current.startY = e.clientY;
              dragRef.current.startH = contentHeight;
              e.preventDefault();
            }}
          />

          {/* Content */}
          <div className="overflow-auto" style={{ height: contentHeight }}>
            {children}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t bg-background">
        <div className="h-[44px] px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto">{barLeft}</div>
          <div className="flex items-center gap-2">
            {barRight}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
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
