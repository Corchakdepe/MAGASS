// src/components/controls/MapsControls/MapsControls.tsx
"use client";

import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import { InstantesInput } from "@/components/controls/CommunControls/instantes-input";
import { StationsSelector } from "@/components/controls/CommunControls/StationsSelector";

export type MapKey =
    | "mapa_densidad"
    | "mapa_circulo"
    | "mapa_voronoi"
    | "mapa_desplazamientos";

type StationsTargetKey = "mapa_densidad" | "mapa_voronoi" | "mapa_circulo";

type MapOption = { label: string; arg: MapKey };

export type MapsControlsProps = {
    MAPAS: MapOption[];
    mapUserName: string;
    setMapUserName: React.Dispatch<React.SetStateAction<string>>;
    selectedMaps: MapKey[];
    setSelectedMaps: React.Dispatch<React.SetStateAction<MapKey[]>>;
    stationsMaps: Record<MapKey, string>;
    setStationsMaps: React.Dispatch<React.SetStateAction<Record<MapKey, string>>>;
    instantesMaps: Record<string, string>;
    setInstantesMaps: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    deltaOutMin: number;
    useFilterForMaps: boolean;
    onActiveStationsTargetKeyChange?: (key: StationsTargetKey) => void;
    onClearExternalStationsMaps?: () => void;
};

// Default empty stations object
const DEFAULT_STATIONS_MAPS: Record<MapKey, string> = {
    mapa_densidad: "",
    mapa_circulo: "",
    mapa_voronoi: "",
    mapa_desplazamientos: "",
};

export function MapsControls({
    MAPAS,
    selectedMaps = [],
    setSelectedMaps,
    stationsMaps = DEFAULT_STATIONS_MAPS,
    setStationsMaps,
    instantesMaps = {},
    setInstantesMaps,
    deltaOutMin,
    useFilterForMaps = false,
    onActiveStationsTargetKeyChange,
    onClearExternalStationsMaps,
    mapUserName = "",
    setMapUserName,
}: MapsControlsProps) {
    const { t } = useLanguage();
    const selectedMap = selectedMaps[0];

    const setStationsFor = (key: MapKey, next: string) => {
        setStationsMaps((prev) => ({ ...prev, [key]: next }));
    };

    const clearStationsFor = (key: MapKey) => {
        setStationsMaps((prev) => ({ ...prev, [key]: "" }));
        onClearExternalStationsMaps?.();
    };

    const setInstantesFor = (key: string, next: string) => {
        setInstantesMaps((prev) => ({ ...prev, [key]: next }));
    };

    const [mapPickerOpen, setMapPickerOpen] = React.useState(false);

    const selectedMapLabel =
        MAPAS.find((m) => m.arg === (selectedMap ?? ""))?.label ?? t('selectMap');

    // Safety check - if stationsMaps is undefined, use default
    const safeStationsMaps = React.useMemo(() => {
        return stationsMaps || DEFAULT_STATIONS_MAPS;
    }, [stationsMaps]);

    return (
        <div className="space-y-4">
            {/* Map selector and name input */}
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                        {t('selectMap')}
                    </Label>
                    <Popover open={mapPickerOpen} onOpenChange={setMapPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={mapPickerOpen}
                                className="h-8 w-full rounded-md border border-surface-3 bg-surface-1/50 text-xs text-text-primary hover:bg-surface-0 transition-colors flex items-center justify-between px-2"
                            >
                                <span className="truncate flex-1 text-left font-medium">
                                    {selectedMapLabel}
                                </span>
                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent
                            align="start"
                            className="w-[--radix-popover-trigger-width] p-1 rounded-lg border border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
                        >
                            <Command className="bg-transparent">
                                <CommandInput
                                    placeholder={t('searchMap')}
                                    className="h-8 text-xs border-none focus:ring-0"
                                />
                                <CommandList className="custom-scrollbar">
                                    <CommandEmpty className="py-2 text-xs text-text-secondary px-2">
                                        {t('noResults')}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {MAPAS.map((m) => {
                                            const isSelected = m.arg === selectedMap;
                                            return (
                                                <CommandItem
                                                    key={m.arg}
                                                    value={m.label}
                                                    onSelect={() => {
                                                        const v = m.arg;
                                                        setSelectedMaps([v]);
                                                        if (
                                                            v === "mapa_densidad" ||
                                                            v === "mapa_voronoi" ||
                                                            v === "mapa_circulo"
                                                        ) {
                                                            onActiveStationsTargetKeyChange?.(v);
                                                        }
                                                        setMapPickerOpen(false);
                                                    }}
                                                    className="text-xs rounded-md mx-1 my-0.5"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-3.5 w-3.5",
                                                            isSelected ? "opacity-100 text-accent" : "opacity-0",
                                                        )}
                                                    />
                                                    <span className={cn("truncate", isSelected && "text-accent font-medium")}>{m.label}</span>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>

                            <div className="pt-1 border-t border-surface-3/50 mt-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full h-7 text-[10px] text-text-tertiary hover:bg-surface-0 rounded-md"
                                    onClick={() => {
                                        setSelectedMaps([]);
                                        setMapPickerOpen(false);
                                    }}
                                >
                                    {t('clearSelection')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                        {t('mapDescriptiveName')}
                    </Label>
                    <Input
                        className="h-8 w-full rounded-md border border-surface-3 bg-surface-1/50 text-xs text-text-primary hover:bg-surface-0 transition-colors focus-visible:ring-2 focus-visible:ring-accent/25 px-2"
                        placeholder={t('mapDescriptiveName')}
                        value={mapUserName}
                        onChange={(e) => setMapUserName(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter warning */}
            {useFilterForMaps && (
                <div className="flex items-center gap-2 rounded-md bg-accent/5 px-2 py-1.5 border border-accent/20 animate-in fade-in slide-in-from-top-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                        {t('activeFilter')}
                    </span>
                </div>
            )}

            {/* Map-specific configuration */}
            {selectedMap && (
                <div className="space-y-4 pt-4 border-t border-surface-3/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Mapa densidad */}
                    {selectedMap === "mapa_densidad" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                    {t('instants')}
                                </Label>
                                <InstantesInput
                                    deltaOutMin={deltaOutMin}
                                    value={instantesMaps["mapa_densidad"] ?? ""}
                                    onChange={(val) => setInstantesFor("mapa_densidad", val)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-medium text-text-secondary">
                                    {t('stations')}
                                </Label>
                                <StationsSelector
                                    mapKey="mapa_densidad"
                                    value={safeStationsMaps["mapa_densidad"] ?? ""}
                                    disabled={useFilterForMaps}
                                    onChange={(_, next) => setStationsFor("mapa_densidad", next)}
                                    onClear={() => clearStationsFor("mapa_densidad")}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mapa círculos */}
                    {selectedMap === "mapa_circulo" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                    {t('stations')}
                                </Label>
                                <StationsSelector
                                    mapKey="mapa_circulo"
                                    value={safeStationsMaps["mapa_circulo"] ?? ""}
                                    disabled={useFilterForMaps}
                                    onChange={(_, next) => setStationsFor("mapa_circulo", next)}
                                    onClear={() => clearStationsFor("mapa_circulo")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                    {t('instants')}
                                </Label>
                                <InstantesInput
                                    deltaOutMin={deltaOutMin}
                                    value={instantesMaps["mapa_circulo"] ?? ""}
                                    onChange={(val) => setInstantesFor("mapa_circulo", val)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mapa Voronoi */}
                    {selectedMap === "mapa_voronoi" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                    {t('instants')}
                                </Label>
                                <InstantesInput
                                    deltaOutMin={deltaOutMin}
                                    value={instantesMaps["mapa_voronoi"] ?? ""}
                                    onChange={(val) => setInstantesFor("mapa_voronoi", val)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mapa de desplazamientos */}
                    {selectedMap === "mapa_desplazamientos" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                    {t('instants')}
                                </Label>
                                <Input
                                    className="h-8 w-full text-xs rounded-md bg-surface-1 border border-surface-3 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                                    placeholder="0;1;2;3;..."
                                    value={instantesMaps["mapa_desplazamientos_inst"] ?? ""}
                                    onChange={(e) =>
                                        setInstantesFor("mapa_desplazamientos_inst", e.target.value)
                                    }
                                />
                                <p className="text-[10px] text-text-tertiary px-1">{t('timeList')}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                        {t('originTimeWindow')}
                                    </Label>
                                    <Input
                                        className="h-8 w-full text-xs rounded-md bg-surface-1 border border-surface-3 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                                        placeholder="0;15;30;60..."
                                        value={instantesMaps["mapa_desplazamientos_d_ori"] ?? ""}
                                        onChange={(e) =>
                                            setInstantesFor("mapa_desplazamientos_d_ori", e.target.value)
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                                        {t('destinationTimeWindow')}
                                    </Label>
                                    <Input
                                        className="h-8 w-full text-xs rounded-md bg-surface-1 border border-surface-3 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                                        placeholder="0;15;30;60..."
                                        value={instantesMaps["mapa_desplazamientos_d_dst"] ?? ""}
                                        onChange={(e) =>
                                            setInstantesFor("mapa_desplazamientos_d_dst", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {/* Movimiento */}
                                <SelectLikeCombobox
                                    label={t('movement')}
                                    placeholder={t('movement')}
                                    value={instantesMaps["mapa_desplazamientos_mov"] ?? ""}
                                    onValueChange={(v) => setInstantesFor("mapa_desplazamientos_mov", v)}
                                    options={[
                                        { label: t('arrivals'), value: "1" },
                                        { label: t('departures'), value: "-1" },
                                    ]}
                                />

                                {/* Tipo */}
                                <SelectLikeCombobox
                                    label={t('type')}
                                    placeholder={t('type')}
                                    value={instantesMaps["mapa_desplazamientos_tipo"] ?? ""}
                                    onValueChange={(v) => setInstantesFor("mapa_desplazamientos_tipo", v)}
                                    options={[
                                        { label: t('real'), value: "1" },
                                        { label: t('fictitious'), value: "0" },
                                        { label: t('all'), value: "" },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SelectLikeCombobox({
    label,
    placeholder,
    value,
    onValueChange,
    options,
}: {
    label: string;
    placeholder: string;
    value: string;
    onValueChange: (v: string) => void;
    options: { label: string; value: string }[];
}) {
    const { t } = useLanguage();
    const [open, setOpen] = React.useState(false);
    const selectedLabel =
        options.find((o) => o.value === value)?.label ?? placeholder;

    return (
        <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-1">
                {label}
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-8 w-full rounded-md border border-surface-3 bg-surface-1/50 text-xs text-text-primary hover:bg-surface-0 transition-colors flex items-center justify-between px-2 font-medium"
                    >
                        <span className="truncate flex-1 text-left font-medium">
                            {selectedLabel}
                        </span>
                        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    className="w-[--radix-popover-trigger-width] p-1 rounded-lg border border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
                >
                    <Command className="bg-transparent">
                        <CommandList className="custom-scrollbar">
                            <CommandGroup>
                                {options.map((o) => {
                                    const isSelected = o.value === value;
                                    return (
                                        <CommandItem
                                            key={`${o.label}-${o.value}`}
                                            value={o.label}
                                            onSelect={() => {
                                                onValueChange(o.value);
                                                setOpen(false);
                                            }}
                                            className="text-xs rounded-md mx-1 my-0.5"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3.5 w-3.5",
                                                    isSelected ? "opacity-100 text-accent" : "opacity-0",
                                                )}
                                            />
                                            <span className={cn("truncate", isSelected && "text-accent font-medium")}>{o.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}