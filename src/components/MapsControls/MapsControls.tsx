"use client";

import * as React from "react";
import {ChevronsUpDown, Check} from "lucide-react";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import {InstantesInput} from "@/components/instantes-input";
import {StationsSelector} from "@/components/StationsSelector";

type MapKey =
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

export function MapsControls({
                                 MAPAS,
                                 selectedMaps,
                                 setSelectedMaps,
                                 stationsMaps,
                                 setStationsMaps,
                                 instantesMaps,
                                 setInstantesMaps,
                                 deltaOutMin,
                                 useFilterForMaps,
                                 onActiveStationsTargetKeyChange,
                                 onClearExternalStationsMaps,
                                 mapUserName,
                                 setMapUserName,
                             }: MapsControlsProps) {
    const selectedMap = selectedMaps[0];

    const setStationsFor = (key: MapKey, next: string) => {
        setStationsMaps((prev) => ({...prev, [key]: next}));
    };

    const clearStationsFor = (key: MapKey) => {
        setStationsMaps((prev) => ({...prev, [key]: ""}));
        onClearExternalStationsMaps?.();
    };

    const setInstantesFor = (key: string, next: string) => {
        setInstantesMaps((prev) => ({...prev, [key]: next}));
    };

    const [mapPickerOpen, setMapPickerOpen] = React.useState(false);

    const selectedMapLabel =
        MAPAS.find((m) => m.arg === (selectedMap ?? ""))?.label ?? "Selecciona mapa…";

    return (
        <div
            className="">{/* Selector de mapa */}
            <div className="grid grid-cols-2 gap-4 ">
                <Popover open={mapPickerOpen} onOpenChange={setMapPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={mapPickerOpen}
                            className="h-9 w-full rounded-md border border-surface-3 bg-surface-1 text-xs text-text-primary hover:bg-surface-0/70 flex items-center justify-between"
                        >
      <span className="truncate flex-1 text-left">
        {selectedMapLabel}
      </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-text-secondary"/>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-2 rounded-lg border border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
                    >
                        <Command className="bg-transparent">
                            <CommandInput
                                placeholder="Buscar mapa…"
                                className="h-9 text-xs"
                            />
                            <CommandList>
                                <CommandEmpty className="py-2 text-xs text-text-secondary">
                                    No hay resultados.
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
                                                className="text-xs"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        isSelected ? "opacity-100 text-accent" : "opacity-0",
                                                    )}
                                                />
                                                <span className="truncate">{m.label}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>

                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full h-8 text-xs text-text-secondary hover:bg-surface-0/70"
                                onClick={() => {
                                    setSelectedMaps([]);
                                    setMapPickerOpen(false);
                                }}
                            >
                                Limpiar selección
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Input
                    className="h-9 w-full rounded-md border border-surface-3 bg-surface-1 text-xs text-text-primary hover:bg-surface-0/70"
                    placeholder="Nombre descriptivo para el mapa"
                    value={mapUserName}
                    onChange={(e) => setMapUserName(e.target.value)}
                />


                {/* Mapa densidad */}
                {selectedMap === "mapa_densidad" && (
                    <section className="grid grid-cols-1 gap-4 ">
                               <InstantesInput
                                deltaOutMin={deltaOutMin}
                                value={instantesMaps["mapa_densidad"] ?? ""}
                                onChange={(val) => setInstantesFor("mapa_densidad", val)}
                            />
                        <StationsSelector
                                mapKey="mapa_densidad"
                                value={stationsMaps["mapa_densidad"] ?? ""}
                                disabled={useFilterForMaps}
                                onChange={(_, next) => setStationsFor("mapa_densidad", next)}
                                onClear={() => clearStationsFor("mapa_densidad")}
                            />
                    </section>
                )}

                {/* Mapa círculos */}
                {selectedMap === "mapa_circulo" && (
                    <section className="grid grid-cols-1 gap-4 ">
                            <StationsSelector
                                mapKey="mapa_circulo"
                                value={stationsMaps["mapa_circulo"] ?? ""}
                                disabled={useFilterForMaps}
                                onChange={(_, next) => setStationsFor("mapa_circulo", next)}
                                onClear={() => clearStationsFor("mapa_circulo")}
                            />
                            <InstantesInput
                                deltaOutMin={deltaOutMin}
                                value={instantesMaps["mapa_circulo"] ?? ""}
                                onChange={(val) => setInstantesFor("mapa_circulo", val)}
                            />
                    </section>
                )}
                {/* Mapa Voronoi */}
                {selectedMap === "mapa_voronoi" && (
                    <section className="">
                            <InstantesInput
                                deltaOutMin={deltaOutMin}
                                value={instantesMaps["mapa_voronoi"] ?? ""}
                                onChange={(val) => setInstantesFor("mapa_voronoi", val)}
                            />
                    </section>
                )}
                {/* Mapa de desplazamientos */}
                {selectedMap === "mapa_desplazamientos" && (
                    <section className="space-y-4 rounded-lg border border-surface-3 bg-surface-1 p-3">
                        <div className="text-xs font-semibold text-text-primary">
                            Mapa de desplazamientos
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-medium text-text-secondary">
                                Instantes
                            </Label>
                            <Input
                                className="h-8 w-full text-xs rounded-md bg-surface-1 border border-surface-3 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
                                placeholder="0;1;2;3;..."
                                value={instantesMaps["mapa_desplazamientos_inst"] ?? ""}
                                onChange={(e) =>
                                    setInstantesFor("mapa_desplazamientos_inst", e.target.value)
                                }
                            />
                            <p className="text-[11px] text-text-secondary">Lista de tiempo</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 min-w-0">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-medium text-text-secondary">
                                    Ventana de tiempo origen
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

                            <div className="space-y-2">
                                <Label className="text-[11px] font-medium text-text-secondary">
                                    Ventana temporal destino
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

                        {/* Movimiento (select-like combobox) */}
                        <SelectLikeCombobox
                            label="Movimiento"
                            placeholder="Movimiento"
                            value={instantesMaps["mapa_desplazamientos_mov"] ?? ""}
                            onValueChange={(v) => setInstantesFor("mapa_desplazamientos_mov", v)}
                            options={[
                                {label: "Entradas (dejar bici)", value: "1"},
                                {label: "Salidas (coger bici)", value: "-1"},
                            ]}
                        />

                        {/* Tipo (select-like combobox) */}
                        <SelectLikeCombobox
                            label="Tipo"
                            placeholder="Tipo"
                            value={instantesMaps["mapa_desplazamientos_tipo"] ?? ""}
                            onValueChange={(v) => setInstantesFor("mapa_desplazamientos_tipo", v)}
                            options={[
                                {label: "Reales", value: "1"},
                                {label: "Ficticios", value: "0"},
                                {label: "Todos", value: ""},
                            ]}
                        />
                    </section>
                )}
                {useFilterForMaps ? (
                    <div className="justify-self-end self-center">
      <span
          className="inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning border border-warning/30">
        Filtro activo
      </span>
                    </div>
                ) : null}
            </div>
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
    const [open, setOpen] = React.useState(false);
    const selectedLabel =
        options.find((o) => o.value === value)?.label ?? placeholder;

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 min-w-0">
            <div className="space-y-2">
                <Label className="text-[11px] font-medium text-text-secondary">
                    {label}
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-9 rounded-md border-surface-3 bg-surface-1 text-xs text-text-primary hover:bg-surface-0/70"
                        >
                            <span className="truncate">{selectedLabel}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-text-secondary"/>
                        </Button>
                    </PopoverTrigger>

                    <PopoverContent
                        align="start"
                        className="w-[--radix-popover-trigger-width] p-2 rounded-lg border border-surface-3 bg-surface-1/95 backdrop-blur-md shadow-mac-panel"
                    >
                        <Command className="bg-transparent">
                            <CommandInput placeholder="Buscar…" className="h-9 text-xs"/>
                            <CommandList>
                                <CommandEmpty className="py-2 text-xs text-text-secondary">
                                    No hay resultados.
                                </CommandEmpty>
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
                                                className="text-xs"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        isSelected ? "opacity-100 text-accent" : "opacity-0",
                                                    )}
                                                />
                                                <span className="truncate">{o.label}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* second column spacer on desktop so the section aligns with your 2-col grids */}
            <div className="hidden md:block"/>
        </div>
    );
}
