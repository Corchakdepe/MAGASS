"use client";

import * as React from "react";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useLanguage} from "@/contexts/LanguageContext";

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
    const {t} = useLanguage();

    const label =
        mapKey === "mapa_densidad"
            ? t('stationsDensity')
            : mapKey === "mapa_circulo"
                ? t('stationsCircle')
                : t('stations');

    return (
        <div className="space-y-1.5">
            <div className="relative group">
                <Input
                    className="w-full h-8 rounded-md border-surface-3 bg-surface-1/50 text-xs text-text-primary hover:bg-surface-0 transition-colors focus-visible:ring-2 focus-visible:ring-accent/25 pr-10"
                    placeholder={t('stationsPlaceholder')}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(mapKey, e.target.value)}
                />
                {value && onClear && !disabled && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-warning transition-colors"
                        onClick={() => onClear()}
                    >
                        <span className="text-[10px] font-bold">✕</span>
                    </button>
                )}
            </div>
            {value && (
                <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-text-tertiary font-medium">
                        {t('selectedCount') || 'Selected'}:
                    </span>
                    <span className="text-[10px] font-bold text-accent">
                        {value.split(';').filter(Boolean).length}
                    </span>
                </div>
            )}
        </div>
    );
}
