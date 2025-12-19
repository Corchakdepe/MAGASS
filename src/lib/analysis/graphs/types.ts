import type { DateRange } from "react-day-picker";

export type DaysSpec = "all" | number[];

export interface StationDays {
  station_id: number;
  days: DaysSpec;
}

export type GraficaKey =
  | "graf_barras_est_med"
  | "graf_barras_est_acum"
  | "graf_barras_dia"
  | "graf_linea_comp_est"
  | "graf_linea_comp_mats";

export type GraficaDef = { label: string; key: GraficaKey };

export type EncodeRangeAsDayList = (range?: DateRange) => string;
