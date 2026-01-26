// src/components/visualizations/types.ts

export interface SeriesMetadata {
  station_id?: number;
  derived: boolean;
  aggregation?: "mean" | "sum" | "cumulative";
  value_type?: string;
  days?: number[] | "all";
  matrix_type?: "current" | "custom";
}

export interface SeriesData {
  id: string;
  label: string;
  values: number[];
  metadata: SeriesMetadata;
}

export interface XAxisConfig {
  values: (number | string)[];
  label: string;
  type: "temporal" | "categorical" | "quantitative";
  unit: "hour" | "station_id" | "value_bin";
  domain?: [number, number];
}

export interface VisualizationConfig {
  recommended: "line" | "bar" | "area";
  supported: ("line" | "bar" | "area")[];
}

export interface ChartContext {
  title: string;
  time_range?: { start: number; end: number; unit: string };
  days?: number[];
  stations?: number[];
  aggregation?: string;
  value_type?: string;
  [key: string]: any;
}

export interface ChartData {
  x: XAxisConfig;
  series: SeriesData[];
}

export interface StandardizedChart {
  id: string;
  kind: "timeseries" | "distribution" | "comparison" | "accumulation" | "station_series";
  format: "json";
  visualization: VisualizationConfig;
  data: ChartData;
  context: ChartContext;
}

export type LegacyChart = {
  id: string;
  kind: "graph" | "heatmap" | string;
  format: "json" | string;
  x: (number | string)[];
  series: Record<string, (number | null)[]>;
  meta?: {
    type?: "bar" | "line" | "area" | string;
    title?: string;
    xLabel?: string;
    yLabel?: string;
    freq?: boolean;
    media?: boolean;
    [k: string]: any;
  };
};

export type BackendChart = StandardizedChart | LegacyChart;

export type ChartDataState = {
  x: (string | number)[];
  series: {
    key: string;
    label: string;
    data: number[];
    derived?: boolean;
  }[];
} | null;

export type PersistedState = {
  selectedGraphId?: string;
  favoritesIds: string[];
  historyOpen?: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;
  formatFilter: string;
};

export interface GraphItem {
  id: string;
  name?: string;
  kind?: string;
  format?: string;
  created?: string;
  url?: string;
  apifullurl?: string;
}
