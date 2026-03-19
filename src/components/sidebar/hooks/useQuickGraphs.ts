import {useState} from "react";
import {useRouter} from "next/navigation";
import {useLanguage} from "@/contexts/LanguageContext";
import {API_BASE} from "@/lib/analysis/constants";
import {parseStationsSimple} from "@/lib/analysis/parsers";
import {buildQuickGraphArg} from "../utils/quickGraphBuilder";
import type {MapsAnalysisState, QuickGraphKey, ALLOWED_GRAPH_MATRIX_IDS} from "../types/mapsAnalysis";

export function useQuickGraphs(
  runId: string | undefined,
  state: MapsAnalysisState,
  inputFolder: string,
  outputFolder: string
) {
  const {t} = useLanguage();
  const router = useRouter();
  const [apiBusy, setApiBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleCreateQuickGraph = async (graphKey: QuickGraphKey) => {
    if (!runId) {
      setApiError(t('selectSimulationBeforeCreatingGraphs'));
      return;
    }
    if (apiBusy) return;

    const stationIds = parseStationsSimple(state.circleStationsForGraphs);
    if (!stationIds.length) {
      setApiError(t('selectStationsBeforeCreatingGraph'));
      return;
    }

    const selectedMatrixId = Number(state.seleccionAgreg || "-1");
    const ALLOWED_IDS = [-1, 0, 1, 9, 10, 11, 12, 13];

    if (!ALLOWED_IDS.includes(selectedMatrixId)) {
      setApiError(`${t('matrixMustBeOneOf')}: ${ALLOWED_IDS.join(", ")}.`);
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
        use_filter_for_maps: false,
        use_filter_for_graphs: false,
        filter_result_filename: null,
        graf_barras_est_med: graphKey === "graf_barras_est_med" ? arg : undefined,
        graf_barras_est_acum: graphKey === "graf_barras_est_acum" ? arg : undefined,
        graf_linea_comp_est: graphKey === "graf_linea_comp_est" ? arg : undefined,
      };

      const res = await fetch(`${API_BASE}/exe/analizar-json`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          `${t('errorCreatingGraph')}: ${res.status} ${JSON.stringify((json as any)?.detail ?? json)}`
        );
      }

      router.push("/analyticsGraphCreator");
    } catch (e: any) {
      setApiError(e?.message ?? t('unexpectedErrorCreatingGraph'));
    } finally {
      setApiBusy(false);
    }
  };

  return {
    apiBusy,
    apiError,
    handleCreateQuickGraph,
  };
}
