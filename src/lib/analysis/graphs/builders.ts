import type { DateRange } from "react-day-picker";
import type { GraficaKey, StationDays } from "./types";

export function nzInt(s?: string) {
  return s && s.trim().length ? Number(s.trim()) : undefined;
}

export function encodeRangeAsDayList(range?: DateRange): string {
  if (!range?.from || !range?.to) return "all";
  const days: number[] = [];
  const current = new Date(range.from);
  while (current <= range.to) {
    days.push(current.getDate());
    current.setDate(current.getDate() + 1);
  }
  return days.join(";");
}

export function buildStationDays(params: {
  lineStations: string;
  lineDays: string; // 'all' or '1;2;3#4;5;6'
}): StationDays[] | undefined {
  const estsStr = params.lineStations.trim();
  const daysStr = params.lineDays.trim();
  if (!estsStr || !daysStr) return undefined;

  const stations = estsStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));

  if (!stations.length) return undefined;

  if (daysStr === "all") {
    return stations.map((st) => ({ station_id: st, days: "all" as const }));
  }

  const parts = daysStr
    .split("#")
    .map((p) => p.trim())
    .filter(Boolean);

  let patterns = parts;
  if (parts.length === 1 && stations.length > 1) patterns = Array(stations.length).fill(parts[0]);
  else if (parts.length !== stations.length) return undefined;

  const specs: StationDays[] = [];
  stations.forEach((st, i) => {
    const p = patterns[i];
    if (p === "all") {
      specs.push({ station_id: st, days: "all" });
      return;
    }
    const dayNums = p
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));

    if (dayNums.length) specs.push({ station_id: st, days: dayNums });
  });

  return specs.length ? specs : undefined;
}

export function buildGraficaArg(params: {
  key: GraficaKey;

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
}): any | null {
  const { key } = params;

  if (key === "graf_barras_est_med" || key === "graf_barras_est_acum") {
    const ests = params.barStations.trim();
    const dias = params.barDays.trim() || "all";
    if (!ests) return null;
    return `${ests}-${dias}`;
  }

  if (key === "graf_barras_dia") {
    const dias = params.dayDays.trim() || "all";
    const freqPart = params.dayFreq ? "-Frec" : "";
    return `${dias}-${params.dayMode}${freqPart}`;
  }

  if (key === "graf_linea_comp_est") {
    return buildStationDays({ lineStations: params.lineStations, lineDays: params.lineDays }) ?? null;
  }

  if (key === "graf_linea_comp_mats") {
    const d = params.matsDelta.trim();
    const e1 = params.matsStations1.trim();
    const e2 = params.matsStations2.trim();
    if (!d || !e1 || !e2) return null;
    return `${d}-${e1}-${e2}-${params.matsMode}`;
  }

  return null;
}
