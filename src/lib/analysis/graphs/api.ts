import { API_BASE } from "@/lib/analysis/constants";
import { buildFiltroFromUnified } from "@/lib/analysis/filters";
import type { FilterKind, UnifiedFilterState } from "@/types/analysis";
import type { GraficaKey } from "./types";
import { buildGraficaArg, nzInt } from "./builders";

export async function analyzeGraphs(params: {
  runId: string;
  seleccionAgreg: string;
  selectedCharts: GraficaKey[];

  deltaMediaTxt: string;
  deltaAcumTxt: string;

  useFilter: boolean;
  filterKind: FilterKind;
  filterState: UnifiedFilterState;

  // graph-specific inputs
  barStations: string;
  barDays: string;

  dayDays: string;
  dayMode: "M" | "A";
  dayFreq: boolean;

  lineStations: string;
  lineDays: string;

  matsDelta: string;
  matsStations1: string;
  matsStations2: string;
  matsMode: "M" | "A";

}) {
  const filtroStr = params.useFilter
    ? buildFiltroFromUnified(params.filterKind, params.filterState, "_")
    : undefined;

  const commonPayload: any = {
    input_folder: `./results/${params.runId}`,
    output_folder: `./results/${params.runId}`,
    seleccion_agregacion: params.seleccionAgreg || "-1",
    delta_media: nzInt(params.deltaMediaTxt),
    delta_acumulada: nzInt(params.deltaAcumTxt),

    filtro: filtroStr,
    tipo_filtro: params.useFilter ? params.filterKind : undefined,
    use_filter_for_maps: false,
    use_filter_for_graphs: params.useFilter,

    filtrado_EstValor: undefined,
    filtrado_EstValorDias: undefined,
    filtrado_Horas: undefined,
    filtrado_PorcentajeEstaciones: undefined,
    filter_result_filename: null,
  };

  const requests = params.selectedCharts.map(async (key) => {
    const arg = buildGraficaArg({
      key,
      barStations: params.barStations,
      barDays: params.barDays,
      dayDays: params.dayDays,
      dayMode: params.dayMode,
      dayFreq: params.dayFreq,
      lineStations: params.lineStations,
      lineDays: params.lineDays,
      matsDelta: params.matsDelta,
      matsStations1: params.matsStations1,
      matsStations2: params.matsStations2,
      matsMode: params.matsMode,
    });

    if (arg == null) throw new Error(`ParÃ¡metros invÃ¡lidos para la grÃ¡fica ${key}`);

    const payload: any = { ...commonPayload, [key]: arg };

    const res = await fetch(`${API_BASE}/exe/analizar-json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`Error analizando grÃ¡fica ${key}: ${res.status} ${(json as any)?.detail ?? ""}`);
    }
    return json;
  });

  return Promise.all(requests);
}