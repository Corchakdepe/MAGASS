"use client";

import * as React from "react";
import {Autocomplete, TextField} from "@mui/material";

import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

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

    return (
        <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/80 p-3">
            {/* Selector de mapa */}
            <div className="space-y-1">
                <Label className="text-xs text-brand-700">Mapa</Label>
                <Autocomplete
                    size="small"
                    options={MAPAS}
                    getOptionLabel={(option) => option.label}
                    value={MAPAS.find((m) => m.arg === (selectedMap ?? "")) ?? null}
                    onChange={(_, newValue) => {
                        if (!newValue) {
                            setSelectedMaps([]);
                            return;
                        }
                        const v = newValue.arg;
                        setSelectedMaps([v]);
                        if (
                            v === "mapa_densidad" ||
                            v === "mapa_voronoi" ||
                            v === "mapa_circulo"
                        ) {
                            onActiveStationsTargetKeyChange?.(v);
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            label="Selecciona mapa..."
                            variant="outlined"
                            sx={{
                                "& .MuiInputBase-input": {fontSize: 12},
                                "& .MuiInputLabel-root": {fontSize: 12},
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "hsl(var(--card))",
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "hsl(var(--border))",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "hsl(var(--ring))",
                                },
                            }}
                        />
                    )}
                />
            </div>

            {/* Nombre del mapa */}
            <div className="mt-2 space-y-1">
                <Label className="text-xs text-brand-700">
                    Nombre del mapa (opcional)
                </Label>
                <Input
                    className="h-7 w-full text-xs border-input bg-background focus-visible:border-ring focus-visible:ring-ring"
                    placeholder="Nombre descriptivo para el mapa"
                    value={mapUserName}
                    onChange={(e) => setMapUserName(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                    Se guardarÃ¡ junto a los ficheros como metadato â€œnameâ€.
                </p>
            </div>

            {/* Mapa densidad */}
            {selectedMap === "mapa_densidad" && (
                <div className="rounded-md border border-brand-100 bg-card px-3 py-2">
                    <div className="mb-2 text-xs font-medium text-brand-700">
                        Mapa densidad
                    </div>
                    <div className="grid grid-cols-1 gap-3 items-start md:grid-cols-2">
                        <StationsSelector
                            mapKey="mapa_densidad"
                            value={stationsMaps["mapa_densidad"] ?? ""}
                            disabled={useFilterForMaps}
                            onChange={(_, next) => setStationsFor("mapa_densidad", next)}
                            onClear={() => clearStationsFor("mapa_densidad")}
                        />

                        <InstantesInput
                            deltaOutMin={deltaOutMin}
                            value={instantesMaps["mapa_densidad"] ?? ""}
                            onChange={(val) => setInstantesFor("mapa_densidad", val)}
                        />
                    </div>
                </div>
            )}


            {selectedMap === "mapa_circulo" && (
                <div className="rounded-md border border-brand-100 bg-card px-3 py-2">
                    <div className="mb-2 text-xs font-medium text-brand-700">
                        Mapa circulos
                    </div>
                    <div className="grid grid-cols-1 gap-3 items-start md:grid-cols-2">
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
                    </div>
                </div>
            )}

            {/* Mapa Voronoi */}
            {selectedMap === "mapa_voronoi" && (
                <div className="rounded-md border border-brand-100 bg-card px-3 py-2">
                    <div className="mb-2 text-xs font-medium text-brand-700">
                        Mapa Voronoi
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-brand-700">
                            Instantes (Voronoi)
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
                <div className="space-y-3 rounded-md border border-brand-100 bg-card px-3 py-2">
                    <div className="text-xs font-medium text-brand-700">
                        Mapa de desplazamientos
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] text-brand-700">
                            Instantes
                        </Label>
                        <Input
                            className="h-7 w-full text-xs border-input bg-background focus-visible:border-ring focus-visible:ring-ring"
                            placeholder="0;1;2;3;..."
                            value={instantesMaps["mapa_desplazamientos_inst"] ?? ""}
                            onChange={(e) =>
                                setInstantesFor("mapa_desplazamientos_inst", e.target.value)
                            }
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Lista de tiempo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-brand-700">
                                Venta de tiempo
                            </Label>
                            <Input
                                className="h-7 w-full text-xs border-input bg-background focus-visible:border-ring focus-visible:ring-ring"
                                placeholder="0;15;30;60..."
                                value={instantesMaps["mapa_desplazamientos_d_ori"] ?? ""}
                                onChange={(e) =>
                                    setInstantesFor(
                                        "mapa_desplazamientos_d_ori",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] text-brand-700">
                                Ventana temporal destino
                            </Label>
                            <Input
                                className="h-7 w-full text-xs border-input bg-background focus-visible:border-ring focus-visible:ring-ring"
                                placeholder="0;15;30;60..."
                                value={instantesMaps["mapa_desplazamientos_d_dst"] ?? ""}
                                onChange={(e) =>
                                    setInstantesFor(
                                        "mapa_desplazamientos_d_dst",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-brand-700">
                                Movimiento
                            </Label>
                            <Autocomplete
                                size="small"
                                options={[
                                    {label: "Entradas (dejar bici)", value: "1"},
                                    {label: "Salidas (coger bici)", value: "-1"},
                                ]}
                                getOptionLabel={(opt) => opt.label}
                                value={
                                    [
                                        {label: "Entradas (dejar bici)", value: "1"},
                                        {label: "Salidas (coger bici)", value: "-1"},
                                    ].find(
                                        (o) =>
                                            o.value ===
                                            (instantesMaps["mapa_desplazamientos_mov"] ?? ""),
                                    ) ?? null
                                }
                                onChange={(_, nv) =>
                                    setInstantesFor(
                                        "mapa_desplazamientos_mov",
                                        nv?.value ?? "",
                                    )
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Movimiento"
                                        variant="outlined"
                                        sx={{
                                            "& .MuiInputBase-input": {fontSize: 12},
                                            "& .MuiInputLabel-root": {fontSize: 12},
                                            "& .MuiOutlinedInput-root": {
                                                backgroundColor: "hsl(var(--background))",
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "hsl(var(--border))",
                                            },
                                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "hsl(var(--ring))",
                                            },
                                        }}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[11px] text-brand-700">Tipo</Label>
                            <Autocomplete
                                size="small"
                                options={[
                                    {label: "Reales", value: "1"},
                                    {label: "Ficticios", value: "0"},
                                    {label: "Todos", value: ""},
                                ]}
                                getOptionLabel={(opt) => opt.label}
                                value={
                                    [
                                        {label: "Reales", value: "1"},
                                        {label: "Ficticios", value: "0"},
                                        {label: "Todos", value: ""},
                                    ].find(
                                        (o) =>
                                            o.value ===
                                            (instantesMaps["mapa_desplazamientos_tipo"] ?? ""),
                                    ) ?? null
                                }
                                onChange={(_, nv) =>
                                    setInstantesFor(
                                        "mapa_desplazamientos_tipo",
                                        nv?.value ?? "",
                                    )
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        label="Tipo"
                                        variant="outlined"
                                        sx={{
                                            "& .MuiInputBase-input": {fontSize: 12},
                                            "& .MuiInputLabel-root": {fontSize: 12},
                                            "& .MuiOutlinedInput-root": {
                                                backgroundColor: "hsl(var(--background))",
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "hsl(var(--border))",
                                            },
                                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "hsl(var(--ring))",
                                            },
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
