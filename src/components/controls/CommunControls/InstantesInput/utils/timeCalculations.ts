import type {TimeCalculationParams} from "../types/instantes";

export const GENERIC_MONTH = new Date(2000, 0, 1); // Jan 2000

export function computeInstanteFromDayTime(params: TimeCalculationParams): number {
  const {day, hour, minute, deltaOutMin} = params;
  const mins = hour * 60 + minute;
  const slot = mins / deltaOutMin;
  return day * (1440 / deltaOutMin) + slot;
}

export function dateDiffInDays(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
}

export function snapMinutesToDelta(minutes: number, deltaStep: number): number {
  if (deltaStep <= 1) return minutes;

  let snapped = Math.round(minutes / deltaStep) * deltaStep;
  if (snapped >= 60) snapped = 60 - deltaStep;

  return snapped;
}
