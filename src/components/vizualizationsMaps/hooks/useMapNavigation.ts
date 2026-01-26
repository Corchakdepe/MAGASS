// src/components/visualizations/maps/hooks/useMapNavigation.ts

import { useEffect } from "react";

interface UseMapNavigationProps {
  selectedIndex: number;
  maxIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onToggleHistory: () => void;
  onOpen: () => void;
  onReload: () => void;
  onToggleFavorite: () => void;
}

export function useMapNavigation({
  selectedIndex,
  maxIndex,
  onPrevious,
  onNext,
  onToggleHistory,
  onOpen,
  onReload,
  onToggleFavorite,
}: UseMapNavigationProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (isTyping) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedIndex > 0) onPrevious();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedIndex < maxIndex) onNext();
      }
      if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        onToggleHistory();
      }
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        onOpen();
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        onReload();
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        onToggleFavorite();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, maxIndex, onPrevious, onNext, onToggleHistory, onOpen, onReload, onToggleFavorite]);
}
