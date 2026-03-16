// components/controls/FilterControls/utils/filterHelpers.ts
import {FilterKind, FilterOperator, UnifiedFilterState} from "../types/filterControls";

export function generateDaysList(fromDate: Date, toDate: Date, dateDiffFn: (a: Date, b: Date) => number): string {
  const diff = dateDiffFn(toDate, fromDate);
  if (diff < 0) return "";

  // Use '#' as separator for days (as required by backend)
  return Array.from({length: diff + 1}, (_, i) => String(i)).join("#");
}

export function formatDaysRange(from?: Date, to?: Date): string {
  if (!from || !to) return "";
  return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
}

export const FILTER_OPERATORS: readonly FilterOperator[] = [">=", "<=", ">", "<", "==", "!="] as const;

export interface EstacionesDiaPayload {
  input_folder: string;
  output_folder: string;
  operator: string;
  value: number;
  times_per_day: number;
  day_index: number;
  matrix_selection: string;
}

export interface EstacionesMesPayload {
  input_folder: string;
  output_folder: string;
  operator: string;
  value: number;
  times_per_day: number;
  days: string;
  exception_days: number;
  matrix_selection: string;
}

export interface HorasPayload {
  input_folder: string;
  output_folder: string;
  operator: string;
  value: number;
  percentage: number;
  matrix_selection: string;
}

export interface PorcentajeTiempoPayload {
  input_folder: string;
  output_folder: string;
  operator: string;
  value: number;
  stations: string;
  matrix_selection: string;
}

export type FilterPayload = EstacionesDiaPayload | EstacionesMesPayload | HorasPayload | PorcentajeTiempoPayload;

export function buildFilterPayload(
  filterKind: FilterKind,
  filterState: UnifiedFilterState,
  daysRange: DateRange | undefined,
  runId: string
): FilterPayload {
  const basePayload = {
    input_folder: `./results/${runId}`,
    output_folder: `./results/${runId}`,
    matrix_selection: filterState.matrixSelection || "1",
    operator: filterState.operator,
    value: parseFloat(filterState.value) || 0,
  };

  switch (filterKind) {
    case "EstValor":
      return {
        ...basePayload,
        times_per_day: parseInt(filterState.dayPct) || 20,
        day_index: 0, // Default to first day
      } as EstacionesDiaPayload;

    case "EstValorDias": {
      const daysStr = filterState.days === "all" ? "all" : filterState.days;
      return {
        ...basePayload,
        times_per_day: parseInt(filterState.dayPct) || 20,
        days: daysStr,
        exception_days: parseInt(filterState.allowedFailDays) || 5,
      } as EstacionesMesPayload;
    }

    case "Horas":
      return {
        ...basePayload,
        percentage: parseFloat(filterState.stationsPct) || 35,
      } as HorasPayload;

    case "Porcentaje":
      return {
        ...basePayload,
        stations: filterState.stationsList || "1;2;3",
      } as PorcentajeTiempoPayload;

    default:
      throw new Error(`Unknown filter kind: ${filterKind}`);
  }
}

// Import DateRange for type safety
import type { DateRange } from "react-day-picker";