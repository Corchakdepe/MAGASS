"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useRouter} from "next/navigation";
import {usePersistentState} from "@/hooks/usePersistentState";
import {MapsControls} from "@/components/MapsControls/MapsControls";
import {MapsAndGraphsFilterControls} from "@/components/MapsAndGraphsFilterControls";
import {MatrixSelect} from "@/components/MatrixSelect";
import {AdvancedControls} from "@/components/AdvancedControls";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import type {DateRange} from "react-day-picker";
import type {
    MapKey,
    StationsTargetKey,
    DeltaMode,
    FilterKind,
    UnifiedFilterState,
} from "@/types/analysis";
import {API_BASE, MATRICES, MAPAS, MAP_KEY_SET} from "@/lib/analysis/constants";
import {parseDeltaFromRunId, parseStationsSimple} from "@/lib/analysis/parsers";
import {buildFiltroFromUnified, dateDiffInDays} from "@/lib/analysis/filters";

type QuickGraphKey =
    | "graf_barras_est_med"
    | "graf_barras_est_acum"
    | "graf_linea_comp_est";

const QUICK_GRAPHS: { label: string; key: QuickGraphKey }[] = [
    {label: "Barras por estación (media)", key: "graf_barras_est_med"},
    {label: "Barras por estación (acumulada)", key: "graf_barras_est_acum"},
    {label: "Líneas comparar estaciones", key: "graf_linea_comp_est"},
];

const ALLOWED_GRAPH_MATRIX_IDS = [-1, 0, 1, 9, 10, 11, 12, 13] as const;
type AllowedGraphMatrixId = (typeof ALLOWED_GRAPH_MATRIX_IDS)[number];

interface MapAnalysisSidebarProps {
    runId?: string;
    externalStationsMaps?: Record<string, string>;
    activeStationsTargetKey?: StationsTargetKey;
    onActiveStationsTargetKeyChange?: (k: StationsTargetKey) => void;
}

function isMapKey(v: string): v is MapKey {
    return MAP_KEY_SET.has(v as MapKey);
}

// Local-only (still used here)
function nzIntLoose(s?: string) {
    if (!s) return undefined;
    const n = Number(String(s).trim());
    return Number.isFinite(n) ? n : undefined;
}

function computeDeltaOutMin(params: {
    deltaInMin: number;
    advancedUser: boolean;
    deltaMode: DeltaMode;
    deltaValueTxt: string;
}) {
    const {deltaInMin, advancedUser, deltaValueTxt} = params;
    if (!advancedUser) return deltaInMin;

    const v = nzIntLoose(deltaValueTxt);
    if (!v || v <= 0) return deltaInMin;

    return v; // target delta in minutes
}

export default function StatisticsForm({
                                           runId,
                                           externalStationsMaps,
                                           activeStationsTargetKey,
                                           onActiveStationsTargetKeyChange,
                                       }: MapAnalysisSidebarProps) {
    const router = useRouter();

    // -------------------------
    // Persistent UI state
    // -------------------------
    const [entrada, setEntrada] = usePersistentState<string>("stats_entrada", "");
    const [salida, setSalida] = usePersistentState<string>("stats_salida", "");
    const [seleccionAgreg, setSeleccionAgreg] = usePersistentState<string>(
        "stats_seleccionAgreg",
        "",
    );

    const [selectedMaps, setSelectedMaps, selectedMapsHydrated] =
        usePersistentState<MapKey[]>("statsselectedMaps", []);

    const [instantesMaps, setInstantesMaps] = usePersistentState<Record<string, string>>(
        "stats_instantesMaps",
        {
            mapa_densidad: "",
            mapa_circulo: "",
            mapa_voronoi: "",
            mapa_desplazamientos_inst: "",
            mapa_desplazamientos_d_ori: "",
            mapa_desplazamientos_d_dst: "",
            mapa_desplazamientos_mov: "",
            mapa_desplazamientos_tipo: "",
        },
    );

    const [stationsMaps, setStationsMaps, stationsHydrated] =
        usePersistentState<Record<string, string>>("stationsMaps", {});

    const [labelsMaps, setLabelsMaps, labelsHydrated] =
        usePersistentState<Record<string, boolean>>("statslabelsMaps", {});

    const [filterKind, setFilterKind] = usePersistentState<FilterKind>(
        "stats_filterKind",
        "EstValorDias",
    );

    const [filterState, setFilterState] = usePersistentState<UnifiedFilterState>(
        "stats_filterState",
        {
            operator: ">=",
            value: "65",
            dayPct: "0",
            days: "all",
            allowedFailDays: "5",
            stationsPct: "0",
            stationsList: "",
        },
    );

    const [useFilterForMaps, setUseFilterForMaps, filterHydrated] =
        usePersistentState<boolean>("statsuseFilterForMaps", false);

    const [advancedUser, setAdvancedUser] = usePersistentState<boolean>(
        "stats_advancedUser",
        false,
    );
    const [deltaMode, setDeltaMode] = usePersistentState<DeltaMode>(
        "stats_deltaMode",
        "media",
    );
    const [deltaValueTxt, setDeltaValueTxt] = usePersistentState<string>(
        "stats_deltaValueTxt",
        "",
    );
    const [advancedEntrada, setAdvancedEntrada] = usePersistentState<string>(
        "stats_advancedEntrada",
        "",
    );
    const [advancedSalida, setAdvancedSalida] = usePersistentState<string>(
        "stats_advancedSalida",
        "",
    );

    // Quick-graph helper UI
    const [circleStationsForGraphs, setCircleStationsForGraphs] =
        usePersistentState<string>("stats_circleStationsForGraphs", "");
    const [quickGraph, setQuickGraph] = useState<QuickGraphKey | null>(null);

    // Calendar state for filter
    const [daysRange, setDaysRange] = useState<DateRange | undefined>();

    // -------------------------
    // Non-persistent runtime state
    // -------------------------
    const parsedDelta = parseDeltaFromRunId(runId);
    const [deltaInMinState, setDeltaInMinState] = useState<number>(parsedDelta ?? 0);
    const [deltaAutoSource, setDeltaAutoSource] = useState<"runId" | "api" | "manual">(
        parsedDelta ? "runId" : "api",
    );
    const [deltaLoading, setDeltaLoading] = useState(false);

    const [apiBusy, setApiBusy] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const deltaInMin = deltaInMinState;

    // Derived folders (same behavior as your original)
    const baseRunFolder = `./results/${runId}`;
    const inputFolder =
        advancedUser && entrada.trim().length > 0
            ? `./results/${entrada.trim()}`
            : baseRunFolder;
    const outputFolder =
        advancedUser && salida.trim().length > 0
            ? `./results/${salida.trim()}`
            : baseRunFolder;

    const deltaOutMin = computeDeltaOutMin({
        deltaInMin,
        advancedUser,
        deltaMode,
        deltaValueTxt,
    });

    // -------------------------
    // Effects
    // -------------------------
    useEffect(() => {
        if (!stationsHydrated) return;
        const circleStations = stationsMaps["mapa_circulo"] ?? "";
        setCircleStationsForGraphs(circleStations);
    }, [stationsHydrated, stationsMaps, setCircleStationsForGraphs]);

    useEffect(() => {
        if (!externalStationsMaps) return;
        if (!stationsHydrated) return;

        setStationsMaps((prev) => ({
            ...prev,
            ...externalStationsMaps,
        }));
    }, [externalStationsMaps, stationsHydrated, setStationsMaps]);

    useEffect(() => {
        const fromRunId = parseDeltaFromRunId(runId);
        if (fromRunId) {
            setDeltaInMinState(fromRunId);
            setDeltaAutoSource("runId");
            return;
        }

        const fetchDelta = async () => {
            if (!runId) {
                setDeltaInMinState(0);
                setDeltaAutoSource("api");
                return;
            }

            setDeltaLoading(true);
            try {
                let res = await fetch(
                    `${API_BASE}/simulation-summary?runId=${encodeURIComponent(runId)}`,
                    {cache: "no-store"},
                );

                if (!res.ok) {
                    res = await fetch(`${API_BASE}/simulation-summary`, {cache: "no-store"});
                }

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const txt = await res.text();
                const cleaned = txt.trim().replace(/^"|"$/g, "");
                const first = cleaned.split(",")[0];
                const n = Number(first);

                if (Number.isFinite(n) && n > 0) {
                    setDeltaInMinState(n);
                    setDeltaAutoSource("api");
                } else {
                    setDeltaInMinState(0);
                    setDeltaAutoSource("manual");
                }
            } catch {
                setDeltaInMinState(0);
                setDeltaAutoSource("manual");
            } finally {
                setDeltaLoading(false);
            }
        };

        fetchDelta();
    }, [runId]);

    // -------------------------
    // Helpers (still local)
    // -------------------------
    const buildMapArg = (
        apiKey: MapKey,
        inst: Record<string, string>,
        st: Record<string, string>,
        labels: Record<string, boolean>,
        useFilter: boolean,
    ): string | null => {
        if (apiKey === "mapa_desplazamientos") {
            const inst0 = (inst["mapa_desplazamientos_inst"] || "").trim();
            const dOri = (inst["mapa_desplazamientos_d_ori"] || "").trim();
            const dDst = (inst["mapa_desplazamientos_d_dst"] || "").trim();
            const mov = (inst["mapa_desplazamientos_mov"] || "").trim();
            const tipo = (inst["mapa_desplazamientos_tipo"] || "").trim();
            if (!inst0 || !dOri || !dDst || !mov || !tipo) return null;
            return `${inst0};${dOri};${dDst};${mov};${tipo}`;
        }

        const supportsStations =
            apiKey === "mapa_densidad" || apiKey === "mapa_circulo" || apiKey === "mapa_voronoi";

        const base = (inst[apiKey] || "").trim();
        if (!base) return null;

        let spec = base;

        if (supportsStations && !useFilter) {
            const stations = (st[apiKey] || "").trim();
            if (stations) spec += `+${stations}`;
        }

        if (apiKey === "mapa_circulo") {
            const labelsOn = labels[apiKey] ?? false;
            if (labelsOn) spec += "-L";
        }

        return spec;
    };

    function buildQuickGraphArg(
        key: QuickGraphKey,
        stationIds: number[],
    ): string | { station_id: number; days: "all" }[] | null {
        if (!stationIds.length) return null;
        if (key === "graf_linea_comp_est") {
            return stationIds.map((id) => ({station_id: id, days: "all" as const}));
        }
        return `${stationIds.join(";")}-all`;
    }

    // -------------------------
    // Actions
    // -------------------------
    const handleAnalyze = async () => {
        if (!runId) {
            setApiError("Selecciona una simulación en el historial antes de analizar.");
            return;
        }
        if (apiBusy || selectedMaps.length === 0) return;

        setApiBusy(true);
        setApiError(null);

        const delta_media =
            advancedUser && deltaMode === "media" ? nzIntLoose(deltaValueTxt) : undefined;
        const delta_acumulada =
            advancedUser && deltaMode === "acumulada" ? nzIntLoose(deltaValueTxt) : undefined;

        const filtroStr = useFilterForMaps
            ? buildFiltroFromUnified(filterKind, filterState, "_")
            : undefined;

        const commonPayload: any = {
            input_folder: inputFolder,
            output_folder: outputFolder,
            seleccion_agregacion: seleccionAgreg || "-1",
            delta_media,
            delta_acumulada,
            filtro: filtroStr,
            tipo_filtro: useFilterForMaps ? filterKind : undefined,
            use_filter_for_maps: useFilterForMaps,
            use_filter_for_graphs: false,

            filtrado_EstValor: undefined,
            filtrado_EstValorDias: undefined,
            filtrado_Horas: undefined,
            filtrado_PorcentajeEstaciones: undefined,
            filter_result_filename: null,
        };

        const mapRequests = selectedMaps.map(async (apiKey) => {
            const arg = buildMapArg(apiKey, instantesMaps, stationsMaps, labelsMaps, useFilterForMaps);
            if (!arg) return null;

            const payload = {...commonPayload, [apiKey]: arg};

            const res = await fetch(`${API_BASE}/exe/analizar-json`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(
                    `Error analizando mapa ${apiKey}: ${res.status} ${(json as any)?.detail ?? ""}`,
                );
            }
            return json;
        });

        try {
            await Promise.all(mapRequests);
        } catch (e: any) {
            setApiError(e?.message ?? "Error inesperado");
        } finally {
            setApiBusy(false);
        }
    };

    const handleCreateQuickGraphFromCircle = async (graphKey: QuickGraphKey) => {
        if (!runId) {
            setApiError("Selecciona una simulación en el historial antes de crear gráficas.");
            return;
        }
        if (apiBusy) return;

        const stationIds = parseStationsSimple(circleStationsForGraphs);
        if (!stationIds.length) {
            setApiError("Selecciona estaciones en el mapa (o escríbelas) antes de crear la gráfica.");
            return;
        }

        const selectedMatrixId = Number(seleccionAgreg || "-1");
        if (!ALLOWED_GRAPH_MATRIX_IDS.includes(selectedMatrixId as AllowedGraphMatrixId)) {
            setApiError(
                `Para crear esta gráfica, la matriz debe ser una de: ${ALLOWED_GRAPH_MATRIX_IDS.join(", ")}.`,
            );
            return;
        }

        const arg = buildQuickGraphArg(graphKey, stationIds);
        if (!arg) {
            setApiError("Parámetros inválidos para la gráfica.");
            return;
        }

        setApiBusy(true);
        setApiError(null);

        try {
            const payload: any = {
                input_folder: inputFolder,
                output_folder: outputFolder,
                seleccion_agregacion: String(selectedMatrixId),

                delta_media: undefined,
                delta_acumulada: undefined,
                filtro: undefined,
                tipo_filtro: undefined,
                use_filter_for_maps: false,
                use_filter_for_graphs: false,
                filter_result_filename: null,

                graf_barras_est_med: graphKey === "graf_barras_est_med" ? arg : undefined,
                graf_barras_est_acum: graphKey === "graf_barras_est_acum" ? arg : undefined,
                graf_linea_comp_est: graphKey === "graf_linea_comp_est" ? arg : undefined,

                grafbarrasdia: undefined,
                graflineacompmats: undefined,

                mapadensidad: undefined,
                videodensidad: undefined,
                mapavoronoi: undefined,
                mapacirculo: undefined,
                mapadesplazamientos: undefined,

                filtradoEstValor: undefined,
                filtradoEstValorDias: undefined,
                filtradoHoras: undefined,
                filtradoPorcentajeEstaciones: undefined,
            };

            const res = await fetch(`${API_BASE}/exe/analizar-json`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(
                    `Error creando gráfica: ${res.status} ${JSON.stringify((json as any)?.detail ?? json)}`,
                );
            }

            router.push("/analyticsGraphCreator");
        } catch (e: any) {
            setApiError(e?.message ?? "Error inesperado al crear la gráfica.");
        } finally {
            setApiBusy(false);
        }
    };

    // -------------------------
    // Hydration gate (persistent state)
    // -------------------------
    const uiHydrated = selectedMapsHydrated && stationsHydrated && labelsHydrated && filterHydrated;

    if (!uiHydrated) {
        return <div className="p-3 text-xs text-muted-foreground">Loading…</div>;
    }

    const selectedMatrixId = Number(seleccionAgreg || "-1");
    const matrixAllowedForGraph = ALLOWED_GRAPH_MATRIX_IDS.includes(
        selectedMatrixId as AllowedGraphMatrixId,
    );


    return (
        <div className="space-y-4">
            <Tabs defaultValue="maps" className="w-full">
                <TabsList className="w-full justify-start flex-wrap">
                    <TabsTrigger value="maps">Maps</TabsTrigger>
                    <TabsTrigger value="filter">Filter</TabsTrigger>
                    <TabsTrigger value="matrix">Matrix</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="maps" className="mt-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Maps</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MapsControls
                                MAPAS={MAPAS}
                                selectedMaps={selectedMaps}
                                setSelectedMaps={setSelectedMaps}
                                stationsMaps={stationsMaps}
                                setStationsMaps={setStationsMaps}
                                instantesMaps={instantesMaps}
                                setInstantesMaps={setInstantesMaps}
                                deltaOutMin={deltaOutMin}
                                useFilterForMaps={useFilterForMaps}
                                onActiveStationsTargetKeyChange={onActiveStationsTargetKeyChange}
                            />

                            <AdvancedControls
                                advancedUser={advancedUser}
                                setAdvancedUser={setAdvancedUser}
                                deltaMode={deltaMode}
                                setDeltaMode={setDeltaMode}
                                deltaValueTxt={deltaValueTxt}
                                setDeltaValueTxt={setDeltaValueTxt}
                                advancedEntrada={advancedEntrada}
                                setAdvancedEntrada={setAdvancedEntrada}
                                advancedSalida={advancedSalida}
                                setAdvancedSalida={setAdvancedSalida}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="filter" className="mt-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Filter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MapsAndGraphsFilterControls
                                useFilterForMaps={useFilterForMaps}
                                setUseFilterForMaps={setUseFilterForMaps}
                                filterKind={filterKind}
                                setFilterKind={setFilterKind}
                                filterState={filterState}
                                setFilterState={setFilterState}
                                daysRange={daysRange}
                                setDaysRange={setDaysRange}
                                dateDiffInDays={dateDiffInDays}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="matrix" className="mt-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Matrix</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MatrixSelect
                                matrices={[...MATRICES]}
                                seleccionAgreg={seleccionAgreg}
                                setSeleccionAgreg={setSeleccionAgreg}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button onClick={handleAnalyze} disabled={apiBusy} className="w-full">
                                {apiBusy ? "Analizando..." : "Analizar mapas"}
                            </Button>

                            <div className="space-y-2">
                                <Label className="text-xs">Crear gráfica rápida</Label>

                                <Autocomplete
                                    size="small"
                                    options={QUICK_GRAPHS}
                                    getOptionLabel={(o) => o.label}
                                    value={QUICK_GRAPHS.find((o) => o.key === quickGraph) ?? null}
                                    onChange={(_, newValue) => setQuickGraph(newValue?.key ?? null)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Tipo de gráfica..."
                                            variant="outlined"
                                            sx={{
                                                "& .MuiInputBase-input": {fontSize: 12},
                                                "& .MuiInputLabel-root": {fontSize: 12},
                                            }}
                                        />
                                    )}
                                    disabled={apiBusy || selectedMaps[0] !== "mapa_circulo" || !matrixAllowedForGraph}
                                />

                                <Input
                                    className="h-8 text-xs w-full"
                                    placeholder="Estaciones para gráficas (ej: 87;212)"
                                    value={circleStationsForGraphs}
                                    onChange={(e) => setCircleStationsForGraphs(e.target.value)}
                                    disabled={apiBusy || selectedMaps[0] !== "mapa_circulo"}
                                />

                                <Button
                                    onClick={() => {
                                        if (!quickGraph) return;
                                        handleCreateQuickGraphFromCircle(quickGraph);
                                    }}
                                    disabled={
                                        apiBusy ||
                                        selectedMaps[0] !== "mapa_circulo" ||
                                        !matrixAllowedForGraph ||
                                        !quickGraph ||
                                        parseStationsSimple(circleStationsForGraphs).length === 0
                                    }
                                    className="w-full"
                                    variant="outline"
                                >
                                    Crear
                                </Button>
                            </div>

                            {apiError && <span className="text-sm text-destructive">{apiError}</span>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

}
