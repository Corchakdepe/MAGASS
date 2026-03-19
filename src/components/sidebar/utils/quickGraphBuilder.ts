import type {QuickGraphKey} from "../types/mapsAnalysis";

export function buildQuickGraphArg(
  key: QuickGraphKey,
  stationIds: number[],
): string | {station_id: number; days: "all"}[] | null {
  if (!stationIds.length) return null;

  if (key === "graf_linea_comp_est") {
    return stationIds.map((id) => ({station_id: id, days: "all" as const}));
  }

  return `${stationIds.join(";")}-all`;
}

export function nzIntLoose(s?: string): number | undefined {
  if (!s) return undefined;
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : undefined;
}

export function computeDeltaOutMin(params: {
  deltaInMin: number;
  advancedUser: boolean;
  deltaMode: "media" | "acumulada";
  deltaValueTxt: string;
}): number {
  const {deltaInMin, advancedUser, deltaValueTxt} = params;
  if (!advancedUser) return deltaInMin;

  const v = nzIntLoose(deltaValueTxt);
  if (!v || v <= 0) return deltaInMin;

  return v;
}
