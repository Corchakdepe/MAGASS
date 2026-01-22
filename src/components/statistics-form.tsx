"use client";

import * as React from "react";
import {useEffect, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useRouter} from "next/navigation";
import {usePersistentState} from "@/hooks/usePersistentState";
import {MapsControls} from "@/components/MapsControls/MapsControls";
import {MapsAndGraphsFilterControls} from "@/components/MapsAndGraphsFilterControls";
import {MatrixSelect} from "@/components/MatrixSelect";
import {AdvancedControls} from "@/components/AdvancedControls";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useLanguage} from "@/contexts/LanguageContext";
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
    const {t} = useLanguage();
    const router = useRouter();

    // Quick-graph options (translated)
    const QUICK_GRAPHS: { label: string; key: QuickGraphKey }[] = [
        {label: t('barsPerStationAverage'), key: "graf_barras_est_med"},
        {label: t('barsPerStationCumulative'), key: "graf_barras_est_acum"},
        {label: t('linesCompareStations'), key: "graf_linea_comp_est"},
    ];

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
            setApiError(t('selectSimulationBeforeAnalyzing'));
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
                    `${t('errorAnalyzingMap')} ${apiKey}: ${res.status} ${(json as any)?.detail ?? ""}`,
                );
            }
            return json;
        });

        try {
            await Promise.all(mapRequests);
        } catch (e: any) {
            setApiError(e?.message ?? t('unexpectedError'));
        } finally {
            setApiBusy(false);
        }
    };

    const handleCreateQuickGraphFromCircle = async (graphKey: QuickGraphKey) => {
        if (!runId) {
            setApiError(t('selectSimulationBeforeCreatingGraphs'));
            return;
        }
        if (apiBusy) return;

        const stationIds = parseStationsSimple(circleStationsForGraphs);
        if (!stationIds.length) {
            setApiError(t('selectStationsBeforeCreatingGraph'));
            return;
        }

        const selectedMatrixId = Number(seleccionAgreg || "-1");
        if (!ALLOWED_GRAPH_MATRIX_IDS.includes(selectedMatrixId as AllowedGraphMatrixId)) {
            setApiError(
                `${t('matrixMustBeOneOf')}: ${ALLOWED_GRAPH_MATRIX_IDS.join(", ")}.`,
            );
            return;
        }

        const arg = buildQuickGraphArg(graphKey, stationIds);
        if (!arg) {
            setApiError(t('invalidGraphParameters'));
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
                    `${t('errorCreatingGraph')}: ${res.status} ${JSON.stringify((json as any)?.detail ?? json)}`,
                );
            }

            router.push("/analyticsGraphCreator");
        } catch (e: any) {
            setApiError(e?.message ?? t('unexpectedErrorCreatingGraph'));
        } finally {
            setApiBusy(false);
        }
    };

    // -------------------------
    // Hydration gate (persistent state)
    // -------------------------
    const uiHydrated = selectedMapsHydrated && stationsHydrated && labelsHydrated && filterHydrated;

    if (!uiHydrated) {
        return <div className="p-3 text-xs text-muted-foreground">{t('loading')}</div>;
    }

    const selectedMatrixId = Number(seleccionAgreg || "-1");
    const matrixAllowedForGraph = ALLOWED_GRAPH_MATRIX_IDS.includes(
        selectedMatrixId as AllowedGraphMatrixId,
    );

    return (
        <div className="space-y-4">
            <Tabs defaultValue="maps" className="w-full">
                {/* Segmented control style tabs */}
                <div
                    className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-2">
                    <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                        {[
                            {v: "maps", l: t('maps')},
                            {v: "filter", l: t('filter')},
                            {v: "matrix", l: t('matrix')},
                            {v: "actions", l: t('actions')},
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.v}
                                value={tab.v}
                                className={[
                                    "h-8 px-3 text-xs rounded-md border border-transparent",
                                    "text-text-secondary hover:text-text-primary",
                                    "data-[state=active]:text-accent data-[state=active]:font-semibold",
                                    "data-[state=active]:bg-accent-soft data-[state=active]:border-accent/25",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                                    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                                ].join(" ")}
                            >
                                {tab.l}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* MAPS */}
                <TabsContent value="maps" className="mt-3">
                    <div
                        className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs font-semibold text-text-primary">{t('maps')}</div>
                                <div className="text-[11px] text-text-secondary">
                                    {t('selectMapsAndConfigureParameters')}
                                </div>
                            </div>

                            <div className="text-[11px] text-text-tertiary">
                                Δ out: <span className="text-text-primary font-semibold">{deltaOutMin}</span> {t('min')}
                            </div>
                        </div>

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
                    </div>
                </TabsContent>

                {/* FILTER */}
                <TabsContent value="filter" className="mt-3">
                    <div
                        className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3">
                        <div className="mb-3">
                            <div className="text-xs font-semibold text-text-primary">{t('filter')}</div>
                            <div className="text-[11px] text-text-secondary">
                                {t('restrictStationsByValueAndDayRange')}
                            </div>
                        </div>

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
                    </div>
                </TabsContent>

                {/* MATRIX */}
                <TabsContent value="matrix" className="mt-3">
                    <div
                        className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3 space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-text-primary">{t('matrix')}</div>
                            <div className="text-[11px] text-text-secondary">
                                {t('chooseAggregationMatrix')}
                            </div>
                        </div>

                        <MatrixSelect
                            matrices={[...MATRICES]}
                            seleccionAgreg={seleccionAgreg}
                            setSeleccionAgreg={setSeleccionAgreg}
                        />
                    </div>
                </TabsContent>

                {/* ACTIONS */}
                <TabsContent value="actions" className="mt-3">
                    <div
                        className="rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel p-3 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-xs font-semibold text-text-primary">{t('actions')}</div>
                                <div className="text-[11px] text-text-secondary">
                                    {t('runAnalysisAndCreateQuickGraphs')}
                                </div>
                            </div>

                            {deltaLoading ? (
                                <div className="text-[11px] text-text-tertiary">{t('deltaLoading')}</div>
                            ) : (
                                <div className="text-[11px] text-text-tertiary">
                                    {t('deltaSource')}: <span className="text-text-primary">{deltaAutoSource}</span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={apiBusy || selectedMaps.length === 0}
                            className="w-full bg-accent text-text-inverted hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
                        >
                            {apiBusy ? t('analyzing') : t('analyzeMaps')}
                        </Button>

                        <div className="rounded-lg border border-surface-3 bg-surface-0/60 p-3 space-y-3">
                            <Label className="text-[11px] text-text-secondary">{t('createQuickGraph')}</Label>

                            <div className="space-y-1">
                                <Label className="text-[11px] text-text-secondary">{t('graphType')}</Label>

                                <select
                                    className={[
                                        "h-9 w-full rounded-md px-2 text-xs",
                                        "bg-surface-1 border border-surface-3",
                                        "text-text-primary",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30",
                                    ].join(" ")}
                                    value={quickGraph ?? ""}
                                    onChange={(e) => setQuickGraph((e.target.value as QuickGraphKey) || null)}
                                    disabled={apiBusy || selectedMaps[0] !== "mapa_circulo" || !matrixAllowedForGraph}
                                >
                                    <option value="" disabled>
                                        {t('graphTypePlaceholder')}
                                    </option>
                                    {QUICK_GRAPHS.map((g) => (
                                        <option key={g.key} value={g.key}>
                                            {g.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="text-[10px] text-text-tertiary">
                                    {t('requiresCircleMapAndAllowedMatrix')}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] text-text-secondary">
                                    {t('stationsForGraphs')}
                                </Label>
                                <Input
                                    className="h-9 text-xs w-full bg-surface-1 border border-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30"
                                    placeholder={t('stationsForGraphsPlaceholder')}
                                    value={circleStationsForGraphs}
                                    onChange={(e) => setCircleStationsForGraphs(e.target.value)}
                                    disabled={apiBusy || selectedMaps[0] !== "mapa_circulo"}
                                />
                            </div>

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
                                {t('create')}
                            </Button>
                        </div>

                        {apiError && <span className="text-xs text-danger">{apiError}</span>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
