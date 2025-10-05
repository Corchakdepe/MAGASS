"use client"
import dynamic from "next/dynamic";
const HeatmapIframe = dynamic(() => import("@/components/HeatmapIframe"), { ssr: false });

export default function Page() {
  // Debe existir bajo public/reports
  const localHtmlPath = "src/app/testmap/20251002_120308_MapaDensidad_instante0D15.0S0.0C0.0.html";
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Test: Heatmap HTML (local)</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Probando el HTML local dentro de un iframe.
      </p>
      <HeatmapIframe src={localHtmlPath} minHeight={800} />
    </main>
  );
}
