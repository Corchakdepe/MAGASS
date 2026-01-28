import type {DateRange} from "react-day-picker";

export function encodeRangeAsDayList(range?: DateRange): string {
  if (!range?.from || !range?.to) return "all";

  const from = range.from;
  const to = range.to;
  const days: number[] = [];
  const current = new Date(from);

  while (current <= to) {
    days.push(current.getDate());
    current.setDate(current.getDate() + 1);
  }

  return days.join(";");
}

export function dateDiffInDays(a: Date, b: Date): number {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((a0.getTime() - b0.getTime()) / (24 * 60 * 60 * 1000));
}
