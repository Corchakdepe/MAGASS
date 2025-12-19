import type { FilterKind, UnifiedFilterState } from "@/types/analysis";

export function dateDiffInDays(a: Date, b: Date) {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
}

export function buildFiltroFromUnified(
  kind: FilterKind,
  f: UnifiedFilterState,
  nullChar = "_",
): string {
  const v = f.value.trim();
  const days = f.days.trim() || "all";
  const dayPct = f.dayPct.trim();
  const fail = f.allowedFailDays.trim();
  const pEst = f.stationsPct.trim();
  const list = f.stationsList.trim();

  if (kind === "EstValor" || kind === "EstValorDias") {
    if (!v || !dayPct || !fail) return nullChar;
    return `${f.operator}${v};${dayPct};${days};${fail}`;
  }

  if (kind === "Horas") {
    if (!v || !pEst) return nullChar;
    return `${f.operator}${v};${pEst}`;
  }

  if (kind === "Porcentaje") {
    if (!v || !list) return nullChar;
    return `${f.operator}${v}-${list}`;
  }

  return nullChar;
}
