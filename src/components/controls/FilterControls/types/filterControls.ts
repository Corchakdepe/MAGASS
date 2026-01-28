import type {DateRange} from "react-day-picker";

export type FilterOperator = ">=" | "<=" | ">" | "<";
export type FilterKind = "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";

export interface UnifiedFilterState {
  operator: string;
  value: string;
  dayPct: string;
  days: string;
  allowedFailDays: string;
  stationsPct: string;
  stationsList: string;
}

export interface MapsAndGraphsFilterControlsProps {
  useFilterForMaps: boolean;
  setUseFilterForMaps: React.Dispatch<React.SetStateAction<boolean>>;
  filterKind: FilterKind;
  setFilterKind: React.Dispatch<React.SetStateAction<FilterKind>>;
  filterState: UnifiedFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<UnifiedFilterState>>;
  daysRange: DateRange | undefined;
  setDaysRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
  dateDiffInDays: (to: Date, from: Date) => number;
}
