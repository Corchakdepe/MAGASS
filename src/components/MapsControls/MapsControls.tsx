import * as React from "react";
import {Autocomplete, TextField} from "@mui/material";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";


import {InstantesInput} from "@/components/instantes-input"; // adjust path
// import { MAPAS } from "..."; // or pass MAPAS as prop

type MapKey =
    | "mapa_densidad"
    | "mapa_circulo"
    | "mapa_voronoi"
    | "mapa_desplazamientos";

type StationsTargetKey = 'mapa_densidad' | 'mapa_voronoi' | 'mapa_circulo';


type InstantesKey =
    | "mapa_densidad"
    | "mapa_circulo"
    | "mapa_voronoi"
    | "mapa_desplazamientos_inst"
    | "mapa_desplazamientos_d_ori"
    | "mapa_desplazamientos_d_dst"
    | "mapa_desplazamientos_mov"
    | "mapa_desplazamientos_tipo";

type MapOption = { label: string; arg: MapKey };

export type MapsControlsProps = {
    MAPAS: MapOption[];

    selectedMaps: MapKey[];
    setSelectedMaps: React.Dispatch<React.SetStateAction<MapKey[]>>;

    stationsMaps: Record<MapKey, string>; // optional (see note below)
    setStationsMaps: React.Dispatch<React.SetStateAction<Record<MapKey, string>>>;

    instantesMaps: Record<string, string>;
    setInstantesMaps: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    deltaOutMin: number;
    useFilterForMaps: boolean;

    onActiveStationsTargetKeyChange?: (key: StationsTargetKey) => void;
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
                             }: MapsControlsProps) {
    return (
        <>
            {/* Map selector */}
            <div className="space-y-1">
                <Autocomplete
                    size="small"
                    options={MAPAS}
                    getOptionLabel={(option) => option.label}
                    value={MAPAS.find((m) => m.arg === (selectedMaps[0] ?? "")) ?? null}
                    onChange={(_, newValue) => {
                        if (!newValue) {
                            setSelectedMaps([]);
                            return;
                        }
                        const v = newValue.arg;
                        setSelectedMaps([v]);

                        if (v === "mapa_densidad" || v === "mapa_voronoi" || v === "mapa_circulo") {
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
                            }}
                        />
                    )}
                />
            </div>

            {/* Densidad */}
            {selectedMaps[0] === "mapa_densidad" && (
                <Card className="mt-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Mapa densidad</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                            {/* Estaciones */}
                            <div className="space-y-1">
                                <Label className="text-xs">Estaciones</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="h-8 text-xs w-full"
                                        value={stationsMaps["mapa_densidad"] ?? ""}
                                        onChange={(e) =>
                                            setStationsMaps((prev) => ({
                                                ...prev,
                                                mapa_densidad: e.target.value,
                                            }))
                                        }
                                        placeholder="1;15;26;48;..."
                                        disabled={useFilterForMaps}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[11px]"
                                        onClick={() => setStationsMaps((prev) => ({...prev, mapa_densidad: ""}))}
                                        disabled={useFilterForMaps}
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>

                            {/* Instantes */}
                            <div className="space-y-1">
                                <InstantesInput
                                    deltaOutMin={deltaOutMin}
                                    value={instantesMaps["mapa_densidad"] ?? ""}
                                    onChange={(val) => setInstantesMaps((prev) => ({...prev, mapa_densidad: val}))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Círculo */}
            {selectedMaps[0] === "mapa_circulo" && (
                <Card className="mt-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Mapa círculo</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                            {/* Estaciones */}
                            <div className="space-y-1">
                                <Label className="text-xs">Estaciones</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="h-8 text-xs w-full"
                                        value={stationsMaps["mapa_circulo"] ?? ""}
                                        onChange={(e) =>
                                            setStationsMaps((prev) => ({
                                                ...prev,
                                                mapa_circulo: e.target.value,
                                            }))
                                        }
                                        placeholder="1;15;26;48;..."
                                        disabled={useFilterForMaps}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[11px]"
                                        onClick={() => setStationsMaps((prev) => ({...prev, mapa_circulo: ""}))}
                                        disabled={useFilterForMaps}
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>

                            {/* Instantes */}
                            <div className="space-y-1">

                                <InstantesInput
                                    deltaOutMin={deltaOutMin}
                                    value={instantesMaps["mapa_circulo"] ?? ""}
                                    onChange={(val) => setInstantesMaps((prev) => ({...prev, mapa_circulo: val}))}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Voronoi */}
            {selectedMaps[0] === "mapa_voronoi" && (
                <Card className="mt-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Mapa Voronoi</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                            <div className="space-y-1 md:col-span-2 xl:col-span-2">
                                <Label className="text-xs">Instantes (Voronoi)</Label>
                                <InstantesInput
                                    value={instantesMaps["mapa_voronoi"] || ""}
                                    onChange={(val) => setInstantesMaps((prev) => ({...prev, mapa_voronoi: val}))}
                                    deltaOutMin={deltaOutMin}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Desplazamientos */}
            {selectedMaps[0] === "mapa_desplazamientos" && (
                <Card className="mt-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Mapa de desplazamientos</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                            {/* Instantes */}
                            <div className="space-y-1">
                                <Label className="text-xs">Instantes (índices de tiempo)</Label>
                                <Input
                                    className="h-8 text-xs w-full"
                                    placeholder="Instantes (ej: 0;10;20)"
                                    value={instantesMaps["mapa_desplazamientos_inst"] || ""}
                                    onChange={(e) =>
                                        setInstantesMaps((prev) => ({
                                            ...prev,
                                            mapa_desplazamientos_inst: e.target.value,
                                        }))
                                    }
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Lista de índices de tiempo separados por “;”.
                                </p>
                            </div>

                            {/* Ventanas */}
                            <div className="space-y-1">
                                <Label className="text-xs">Ventana temporal (Δ = {deltaOutMin} min)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Δ origen"
                                        select
                                        SelectProps={{native: true}}
                                        value={instantesMaps["mapa_desplazamientos_d_ori"] || ""}
                                        onChange={(e) =>
                                            setInstantesMaps((prev) => ({
                                                ...prev,
                                                mapa_desplazamientos_d_ori: e.target.value,
                                            }))
                                        }
                                        sx={{
                                            "& .MuiInputBase-input": {fontSize: 12},
                                            "& .MuiInputLabel-root": {fontSize: 12},
                                        }}
                                    >
                                        <option value="">Sin ventana</option>
                                        <option value="1">15 min</option>
                                        <option value="2">30 min</option>
                                        <option value="4">1 h</option>
                                        <option value="8">2 h</option>
                                    </TextField>

                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Δ destino"
                                        select
                                        SelectProps={{native: true}}
                                        value={instantesMaps["mapa_desplazamientos_d_dst"] || ""}
                                        onChange={(e) =>
                                            setInstantesMaps((prev) => ({
                                                ...prev,
                                                mapa_desplazamientos_d_dst: e.target.value,
                                            }))
                                        }
                                        sx={{
                                            "& .MuiInputBase-input": {fontSize: 12},
                                            "& .MuiInputLabel-root": {fontSize: 12},
                                        }}
                                    >
                                        <option value="">Sin ventana</option>
                                        <option value="1">15 min</option>
                                        <option value="2">30 min</option>
                                        <option value="4">1 h</option>
                                        <option value="8">2 h</option>
                                    </TextField>
                                </div>
                            </div>

                            {/* Movimiento / tipo */}
                            <div className="space-y-1">
                                <Label className="text-xs">Movimiento y tipo</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                                            ].find((o) => o.value === (instantesMaps["mapa_desplazamientos_mov"] || "")) ??
                                            null
                                        }
                                        onChange={(_, nv) =>
                                            setInstantesMaps((prev) => ({
                                                ...prev,
                                                mapa_desplazamientos_mov: nv?.value ?? "",
                                            }))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                label="Entrada / salida"
                                                variant="outlined"
                                                sx={{
                                                    "& .MuiInputBase-input": {fontSize: 12},
                                                    "& .MuiInputLabel-root": {fontSize: 12},
                                                }}
                                            />
                                        )}
                                    />

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
                                            ].find((o) => o.value === (instantesMaps["mapa_desplazamientos_tipo"] ?? "")) ??
                                            null
                                        }
                                        onChange={(_, nv) =>
                                            setInstantesMaps((prev) => ({
                                                ...prev,
                                                mapa_desplazamientos_tipo: nv?.value ?? "",
                                            }))
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
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
