import type {DateRange} from "react-day-picker";

export function encodeRangeAsDayList(
  range: DateRange | undefined,
  dateDiffFn: (a: Date, b: Date) => number
): string {
  if (!range?.from || !range?.to) return "all";

  const diff = dateDiffFn(range.to, range.from);
  if (diff < 0) return "all";

  return Array.from({length: diff + 1}, (_, i) => String(i)).join(";");
}

export function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from || !range?.to) return "";
  return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
}
