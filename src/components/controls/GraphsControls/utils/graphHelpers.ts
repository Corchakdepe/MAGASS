import type { DateRange } from "react-day-picker";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function encodeRangeAsDayList(
  range: DateRange | undefined,
  simulationStartDate: Date,
  dateDiffFn: (a: Date, b: Date) => number
): string {
  if (!range?.from || !range?.to) return "all";

  const from = startOfDay(range.from);
  const to = startOfDay(range.to);
  const simStart = startOfDay(simulationStartDate);

  const startIndex = dateDiffFn(from, simStart);
  const endIndex = dateDiffFn(to, simStart);

  if (startIndex < 0 || endIndex < startIndex) return "all";

  return Array.from(
    { length: endIndex - startIndex + 1 },
    (_, i) => String(startIndex + i)
  ).join(";");
}

export function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from || !range?.to) return "";
  return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`;
}
