"use client";

import * as React from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

type MapKey =
    | "mapa_densidad"
    | "mapa_circulo"
    | "mapa_voronoi"
    | "mapa_desplazamientos";

export type StationsSelectorProps = {
    mapKey: MapKey;
    value: string;
    disabled?: boolean;
    onChange: (mapKey: MapKey, next: string) => void;
    onClear?: () => void;
};

export function StationsSelector({
                                     mapKey,
                                     value,
                                     disabled = false,
                                     onChange,
                                     onClear,
                                 }: StationsSelectorProps) {
    const label =
        mapKey === "mapa_densidad"
            ? "Estaciones (densidad)"
            : mapKey === "mapa_circulo"
                ? "Estaciones (círculo)"
                : "Estaciones";

    return (
        <div className="space-y-1">

            <Input
                className="w-full justify-between h-9 rounded-md border-surface-3 bg-surface-1 text-xs text-text-primary hover:bg-surface-0/70"
                placeholder="Estaciones 0;1;2;3;..."
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(mapKey, e.target.value)}
            />
            <div className="mt-5 flex items-baseline justify-between gap-3">
                    <span
                        className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
     {value || "0"}
    </span>
            </div>
            <div className="flex items-center justify-between gap-2">
                {value && onClear && (
                    <button
                        type="button"
                        className="rounded-full border border-warning/25 bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"
                        onClick={() => onClear()}
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    )
        ;

}
