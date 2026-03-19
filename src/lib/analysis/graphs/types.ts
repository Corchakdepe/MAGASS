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

export type GraphsSelectorCardProps = {
    GRAFICAS: GraficaDef[];

    selectedCharts: GraficaKey[];
    setSelectedCharts: (next: GraficaKey[]) => void;

    useFilter: boolean;

    // barras est
    barStations: string;
    setBarStations: (v: string) => void;
    barDaysRange: DateRange | undefined;
    setBarDaysRange: (r: DateRange | undefined) => void;
    barDays: string;
    setBarDays: (v: string) => void;

    // barras dia
    dayDaysRange: DateRange | undefined;
    setDayDaysRange: (r: DateRange | undefined) => void;
    dayDays: string;
    setDayDays: (v: string) => void;
    dayMode: "M" | "A";
    setDayMode: (v: "M" | "A") => void;
    dayFreq: boolean;
    setDayFreq: (v: boolean) => void;

    // linea comp est
    lineStations: string;
    setLineStations: (v: string) => void;
    lineDaysRange: DateRange | undefined;
    setLineDaysRange: (r: DateRange | undefined) => void;
    lineDays: string;
    setLineDays: (v: string) => void;

    // linea comp mats
    matsDelta: string;
    setMatsDelta: (v: string) => void;
    matsMode: "M" | "A";
    setMatsMode: (v: "M" | "A") => void;
    matsStations1: string;
    setMatsStations1: (v: string) => void;
    matsStations2: string;
    setMatsStations2: (v: string) => void;

    // helpers
    encodeRangeAsDayList: (range?: DateRange) => string;
};
