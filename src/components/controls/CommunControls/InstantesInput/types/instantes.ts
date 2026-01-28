import type {DateRange} from "react-day-picker";
import type {Dayjs} from "dayjs";

export type Step = "date" | "fromTime" | "toTime";
export type ClockView = "hours" | "minutes";

export interface InstantesInputProps {
  deltaOutMin: number;
  value: string;
  onChange: (next: string) => void;
}

export interface InstantesState {
  open: boolean;
  range: DateRange | undefined;
  calendarMonth: Date;
  step: Step;
  clockView: ClockView;
  fromTime: Dayjs;
  toTime: Dayjs;
}

export interface TimeCalculationParams {
  day: number;
  hour: number;
  minute: number;
  deltaOutMin: number;
}
