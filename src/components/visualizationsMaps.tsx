// components/visualization-maps.tsx
'use client';

import type {RawResultItem} from '@/components/main-content';
import {MapPlus, ChevronUp} from 'lucide-react';
import React, {useEffect, useMemo, useState} from 'react';

import {Button} from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

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
    onStationPick?: (p: { mapName?: string; station: number; data?: number | null }) => void;
};


export default function VisualizationMaps({runId, apiBase, maps, onStationPick}: VisualizationMapsProps) {
    const [selectedMap, setSelectedMap] = useState<RawResultItem | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    const orderedMaps = useMemo(() => {
        const copy = [...(maps ?? [])];
        copy.sort((a, b) => String(a.created ?? '').localeCompare(String(b.created ?? '')));
        return copy;
    }, [maps]);

    useEffect(() => {
        setSelectedMap(orderedMaps.at(-1) ?? null);
    }, [runId, orderedMaps]);

    useEffect(() => {
        const handler = (ev: MessageEvent) => {
            const msg = ev.data;

            // Optional debug
            console.log('MAP MSG RECEIVED', msg, 'type=', msg?.type);

            if (!msg || (msg.type !== 'MAPSTATIONCLICK' && msg.type !== 'MAP_STATION_CLICK')) return;
            console.log("MAP MSG RECEIVED", msg, "type=", msg?.type);
            onStationPick?.({
                mapName: msg.mapName,
                station: Number(msg.station),
                data: msg.data ?? null,
            });
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [onStationPick]);


    if (!orderedMaps || orderedMaps.length === 0) {
        return (
            <section>
                <h2 className="text-lg font-semibold mb-2">Analytics Maps Creator</h2>
                <p className="text-xs text-muted-foreground">No map results found for this run.</p>
            </section>
        );
    }

    const active = selectedMap ?? orderedMaps.at(-1);
    if (!active) return null;

    const href = active.api_full_url ?? `${apiBase}${active.url}`;
    const isHtml = active.format === 'html';
    const displayName = prettyMapName(active.name);

    return (
        <section className="space-y-3 w-full">
            {/* Map */}
            <div className="border rounded-md p-4 bg-card flex flex-col h-[80vh] w-full">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-medium mb-1 truncate" title={displayName}>
                            {displayName}
                        </p>
                        <p className="text-xs mb-2 truncate" title={active.name}>
                            {active.name}
                        </p>
                        <p className="text-xs mb-2">
                            Format: {active.format} | Kind: {active.kind}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-muted"
                            title="Open map in new tab"
                        >
                            Open
                        </a>
                    </div>

                </div>

                {isHtml ? (
                    <div className="flex-1 min-h-0">
                        <iframe src={href} className="w-full h-full border rounded" loading="lazy"/>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Este resultado no es HTML, no se puede previsualizar en iframe.
                    </p>
                )}
            </div>

            {/* Bottom picker bar */}
            <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-card">
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Selected map</div>
                    <div className="text-sm truncate">{displayName}</div>
                </div>

                <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                            <ChevronUp className="h-4 w-4 mr-2"/>
                            Choose map
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="p-0">
                        <div className="p-4">
                            <SheetHeader>
                                <SheetTitle>Maps history ({orderedMaps.length})</SheetTitle>
                            </SheetHeader>
                        </div>

                        <div className="px-4 pb-4">
                            <div className="border rounded max-h-[50vh] overflow-y-auto">
                                <ul className="divide-y">
                                    {orderedMaps.map((m) => {
                                        const title = prettyMapName(m.name);
                                        const selected = active.id === m.id;

                                        return (
                                            <li key={m.id}>
                                                <button
                                                    type="button"
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                                                        selected ? 'bg-accent' : ''
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedMap(m);
                                                        setPickerOpen(false);
                                                    }}
                                                    title={m.name}
                                                >
                                                    <div className="font-medium truncate">{title}</div>
                                                    <div className="text-[11px] text-muted-foreground truncate">
                                                        {m.name}
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </section>
    );
}
