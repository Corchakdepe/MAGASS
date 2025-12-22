export type MapKey =
  | "mapa_densidad"
  | "mapa_voronoi"
  | "mapa_circulo"
  | "mapa_desplazamientos";

export type StationsTargetKey = "mapa_densidad" | "mapa_voronoi" | "mapa_circulo";

export type DeltaMode = "media" | "acumulada";

export type FilterKind = "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";

export type UnifiedFilterState = {
  operator: string;
  value: string;
  dayPct: string;
  days: string;
  allowedFailDays: string;
  stationsPct: string;
  stationsList: string;
};