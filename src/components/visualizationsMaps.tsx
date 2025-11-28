// components/visualization-maps.tsx
'use client';

import type { RawResultItem } from '@/components/main-content';

type VisualizationMapsProps = {
  runId: string;
  apiBase: string;
  maps: RawResultItem[];
};

export default function VisualizationMaps({
  runId,
  apiBase,
  maps,
}: VisualizationMapsProps) {
  if (!maps || maps.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Maps – {runId}</h2>
        <p className="text-xs text-muted-foreground">
          No map results found for this run.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">Maps – {runId}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {maps.map(map => {
          const href = map.api_full_url ?? `${apiBase}${map.url}`;
          const isHtml = map.format === 'html';
          const isPng = map.format === 'png';

          return (
            <div
              key={map.id}
              className="border rounded-md p-4 bg-card text-sm text-muted-foreground"
            >
              <p className="font-medium mb-1">{map.name}</p>
              <p className="text-xs mb-2">
                Format: {map.format} | Kind: {map.kind}
              </p>

              {isHtml && (
                <iframe
                  src={href}
                  className="w-full h-64 border rounded"
                  loading="lazy"
                />
              )}

              {isPng && (
                <img
                  src={href}
                  alt={map.name}
                  className="w-full h-64 object-cover rounded"
                />
              )}

              {!isHtml && !isPng && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  Open map
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
