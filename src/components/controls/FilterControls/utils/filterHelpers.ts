import {FilterOperator} from "@/components/controls/FilterControls/types/filterControls";

export function generateDaysList(fromDate: Date, toDate: Date, dateDiffFn: (a: Date, b: Date) => number): string {
  const diff = dateDiffFn(toDate, fromDate);
  if (diff < 0) return "";

  return Array.from({length: diff + 1}, (_, i) => String(i)).join(";");
}

export function formatDaysRange(from?: Date, to?: Date): string {
  if (!from || !to) return "";
  return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
}

export const FILTER_OPERATORS: readonly FilterOperator[] = [">=", "<=", ">", "<"] as const;
