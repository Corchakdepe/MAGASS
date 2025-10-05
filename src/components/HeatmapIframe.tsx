"use client";

import { useEffect, useRef } from "react";

type HeatmapIframeProps = {
  src: string; // Ruta bajo /public, p.ej. "/reports/MapaDensidad_instante0D15.0S0.0C0.0.html"
  title?: string;
  className?: string;
  minHeight?: number; // px
};

export default function HeatmapIframe({
  src,
  title = "Heatmap Report",
  className = "w-full rounded-lg border",
  minHeight = 800,
}: HeatmapIframeProps) {
  const ref = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const onLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const h = Math.max(
            doc.body?.scrollHeight || 0,
            doc.documentElement?.scrollHeight || 0,
            minHeight
          );
          iframe.style.height = `${h}px`;
        }
      } catch {
        iframe.style.height = `${minHeight}px`;
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [src, minHeight]);

  return (
    <iframe
      ref={ref}
      src={src}
      title={title}
      className={className}
      style={{ minHeight }}
      sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
