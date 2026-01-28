import {useState} from "react";
import {useLanguage} from "@/contexts/LanguageContext";
import {API_BASE} from "@/lib/analysis/constants";
import {buildFiltroFromUnified} from "@/lib/analysis/filters";
import {buildMapArg} from "../utils/mapArgBuilder";
import {nzIntLoose} from "../utils/quickGraphBuilder";
import type {MapsAnalysisState} from "../types/mapsAnalysis";

export function useMapsAnalysis(runId: string | undefined, state: MapsAnalysisState) {
  const {t} = useLanguage();
  const [apiBusy, setApiBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const baseRunFolder = `./results/${runId}`;
  const inputFolder =
    state.advancedUser && state.entrada.trim().length > 0
      ? `./results/${state.entrada.trim()}`
      : baseRunFolder;
  const outputFolder =
    state.advancedUser && state.salida.trim().length > 0
      ? `./results/${state.salida.trim()}`
      : baseRunFolder;

  const handleAnalyze = async () => {
    if (!runId) {
      setApiError(t('selectSimulationBeforeAnalyzing'));
      return;
    }
    if (apiBusy || state.selectedMaps.length === 0) return;

    setApiBusy(true);
    setApiError(null);

    const delta_media =
      state.advancedUser && state.deltaMode === "media"
        ? nzIntLoose(state.deltaValueTxt)
        : undefined;
    const delta_acumulada =
      state.advancedUser && state.deltaMode === "acumulada"
        ? nzIntLoose(state.deltaValueTxt)
        : undefined;

    const filtroStr = state.useFilterForMaps
      ? buildFiltroFromUnified(state.filterKind, state.filterState, "_")
      : undefined;

    const commonPayload: any = {
      input_folder: inputFolder,
      output_folder: outputFolder,
      seleccion_agregacion: state.seleccionAgreg || "-1",
      delta_media,
      delta_acumulada,
      filtro: filtroStr,
      tipo_filtro: state.useFilterForMaps ? state.filterKind : undefined,
      use_filter_for_maps: state.useFilterForMaps,
      use_filter_for_graphs: false,
      filter_result_filename: null,
    };

    const mapRequests = state.selectedMaps.map(async (apiKey) => {
      const arg = buildMapArg(
        apiKey,
        state.instantesMaps,
        state.stationsMaps,
        state.labelsMaps,
        state.useFilterForMaps
      );
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
          `${t('errorAnalyzingMap')} ${apiKey}: ${res.status} ${(json as any)?.detail ?? ""}`
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

  return {
    apiBusy,
    apiError,
    handleAnalyze,
    inputFolder,
    outputFolder,
  };
}
