// components/visualization-maps.tsx
'use client';

import type { RawResultItem } from '@/components/main-content';
import { MapPlus } from 'lucide-react';
import React from 'react';

const prettyMapName = (raw: string) => {

  let s = raw.replace(/^\d{8}_\d{6}_/, '');

  s = s.replace(/_/g, ' ');

  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');

  const m = s.match(/^(.+?)\s+instante(\d+)D(\d+)/);
  if (m) {
    const base = m[1].trim();
    const inst = m[2];
    const delta = m[3];

    const baseWithDe = base.replace(/^Mapa\s+/i, 'Mapa de ');
    return `${baseWithDe} instante ${inst} Delta ${delta}`;
  }

  return s.trim().replace(/^Mapa\s+/i, 'Mapa de ');
};

type VisualizationMapsProps = {
  runId: string;
  apiBase: string;
  maps: RawResultItem[];
};

export default function VisualizationMaps({ runId, apiBase, maps }: VisualizationMapsProps) {
  if (!maps || maps.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-2">Analytics Maps Creator</h2>
        <p className="text-xs text-muted-foreground">No map results found for this run.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <MapPlus className="h-5 w-5 text-xl" />
        <h2 className="text-lg font-semibold mb-2">Analytics Maps Creator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {maps.map((map) => {
          const href = map.api_full_url ?? `${apiBase}${map.url}`;
          const isHtml = map.format === 'html';
          const isPng = map.format === 'png';

          const displayName = prettyMapName(map.name);

          return (
            <div
              key={map.id}
              className="border rounded-md p-4 bg-card text-sm text-muted-foreground"
            >
              <p className="font-medium mb-1" title={displayName}>
                {displayName}
              </p>

              <p className="text-xs mb-2">
                Format: {map.format} | Kind: {map.kind}
              </p>

              {isHtml && <iframe src={href} className="w-full h-64 border rounded" loading="lazy" />}

              {isPng && <img src={href} alt={displayName} className="w-full h-64 object-cover rounded" />}

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
