import type { DateRange } from "react-day-picker";

export type GraphKey =
  | "graf_barras_est_med"
  | "graf_barras_est_acum"
  | "graf_barras_dia"
  | "graf_linea_comp_est"
  | "graf_linea_comp_mats";

export interface GraphOption {
  label: string;
  key: GraphKey;
}

export interface GraphsSelectorCardProps {
  GRAFICAS: readonly GraphOption[];

  selectedCharts: GraphKey[];
  setSelectedCharts: (charts: GraphKey[]) => void;

  useFilter: boolean;

  // Bar chart: legacy backend expects ONE station, format "99-all"
  barStation: string;
  setBarStation: (value: string) => void;
  barDaysRange: DateRange | undefined;
  setBarDaysRange: (range: DateRange | undefined) => void;
  barDays: string;
  setBarDays: (value: string) => void;

  // Day chart: legacy backend expects "days-M" or non-M, plus optional "Frec"
  dayDaysRange: DateRange | undefined;
  setDayDaysRange: (range: DateRange | undefined) => void;
  dayDays: string;
  setDayDays: (value: string) => void;
  dayMode: "X" | "M";
  setDayMode: (mode: "X" | "M") => void;
  dayFreq: boolean;
  setDayFreq: (value: boolean) => void;

  // Line comparison: multiple stations allowed
  lineStations: string;
  setLineStations: (value: string) => void;
  lineDaysRange: DateRange | undefined;
  setLineDaysRange: (range: DateRange | undefined) => void;
  lineDays: string;
  setLineDays: (value: string) => void;

  // Matrix comparison: legacy backend checks mode === "M"
  matsDelta: string;
  setMatsDelta: (value: string) => void;
  matsMode: "X" | "M";
  setMatsMode: (mode: "X" | "M") => void;
  matsStations1: string;
  setMatsStations1: (value: string) => void;
  matsStations2: string;
  setMatsStations2: (value: string) => void;

  encodeRangeAsDayList: (range: DateRange | undefined) => string;
}
