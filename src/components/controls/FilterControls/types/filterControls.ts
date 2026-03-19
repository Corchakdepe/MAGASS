// components/controls/FilterControls/types/filterControls.ts
import type {DateRange} from "react-day-picker";

export type FilterOperator = ">=" | "<=" | ">" | "<" | "==" | "!=";
export type FilterKind = "EstValor" | "EstValorDias" | "Horas" | "Porcentaje";

export interface UnifiedFilterState {
  operator: string;
  value: string;
  dayPct: string;          // times_per_day for EstValor/EstValorDias
  days: string;             // day indices separated by '#' or 'all'
  allowedFailDays: string;  // exception_days for EstValorDias
  stationsPct: string;      // percentage for Horas filter
  stationsList: string;     // stations for Porcentaje filter
  matrixSelection: string;  // matrix ID (default "1" for Ocupacion_Relativa)
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

export interface FilterResponse {
  success: boolean;
  filter_type: string;
  data: number[];
  result_file: string;
  message: string;
}