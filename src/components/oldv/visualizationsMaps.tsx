// components/visualizationsMaps.tsx
'use client';

import { ExternalLink, Download } from 'lucide-react';

type MapItem = {
  id: string;
  name: string;
  kind: 'map';
  format: 'html' | 'png';
  url: string;
};

type VisualizationsMapsProps = {
  runId: string;
  maps: MapItem[];
  apiBase: string;
};

export default function VisualizationsMaps({ runId, maps, apiBase }: VisualizationsMapsProps) {
  if (!maps?.length) {
    return (
      <div className="rounded border p-4 text-sm text-muted-foreground">
        No maps for run {runId}. Generate density/voronoi/circles in the analyzer and refresh.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Maps ({maps.length})</h2>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {maps.map(m => (
          <article key={m.id} className="rounded-md border bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-medium truncate">{m.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-sm underline"
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
                <a
                  href={m.url}
                  download
                  className="inline-flex items-center gap-1 text-sm underline"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            </div>
            <div className="p-3">
              {m.format === 'html' ? (
                <iframe
                  src={m.url}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-[520px] rounded border"
                />
              ) : (
                <img src={m.url} alt={m.name} className="w-full rounded border" />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
