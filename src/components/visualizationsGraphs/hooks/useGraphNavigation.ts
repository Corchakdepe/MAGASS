// src/components/visualizations/hooks/useGraphNavigation.ts

import { useEffect } from "react";

export function useGraphNavigation(
  selectedIndex: number,
  maxIndex: number,
  onPrevious: () => void,
  onNext: () => void,
  onToggleHistory: () => void
) {
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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, maxIndex, onPrevious, onNext, onToggleHistory]);
}
