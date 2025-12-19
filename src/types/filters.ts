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
