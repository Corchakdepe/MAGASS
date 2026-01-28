import type {DateRange} from "react-day-picker";

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

  // Selected charts
  selectedCharts: GraphKey[];
  setSelectedCharts: (charts: GraphKey[]) => void;

  // Filter
  useFilter: boolean;

  // Bar chart (stations)
  barStations: string;
  setBarStations: (value: string) => void;
  barDaysRange: DateRange | undefined;
  setBarDaysRange: (range: DateRange | undefined) => void;
  barDays: string;
  setBarDays: (value: string) => void;

  // Bar chart (day)
  dayDaysRange: DateRange | undefined;
  setDayDaysRange: (range: DateRange | undefined) => void;
  dayDays: string;
  setDayDays: (value: string) => void;
  dayMode: "Suma" | "Media";  // Changed to match components
  setDayMode: (mode: "Suma" | "Media") => void;
  dayFreq: string;  // Changed to string to match components
  setDayFreq: (value: string) => void;

  // Line chart (stations)
  lineStations: string;
  setLineStations: (value: string) => void;
  lineDaysRange: DateRange | undefined;
  setLineDaysRange: (range: DateRange | undefined) => void;
  lineDays: string;
  setLineDays: (value: string) => void;

  // Matrix comparison
  matsDelta: string;
  setMatsDelta: (value: string) => void;
  matsMode: "Suma" | "Media";  // Changed to match components
  setMatsMode: (mode: "Suma" | "Media") => void;
  matsStations1: string;
  setMatsStations1: (value: string) => void;
  matsStations2: string;
  setMatsStations2: (value: string) => void;

  // Helper
  encodeRangeAsDayList: (range: DateRange | undefined) => string;
}
