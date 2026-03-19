// src/components/visualizations/utils/formatters.ts

export function formatXAxisLabel(value: number | string, unit?: string): string {
  if (typeof value === "string") return value;

  switch (unit) {
    case "hour":
      return `${String(value).padStart(2, "0")}:00`;
    case "value_bin":
      return value.toFixed(1);
    case "station_id":
      return String(value);
    default:
      return String(value);
  }
}

export function prettyGraphName(raw: string): string {
  let s = raw.replace(/(\d{8}_\d{6}_)/g, "");
  s = s.replace(/_/g, " ");
  return s.trim();
}

export function generateColorPalette(count: number, isDerived: boolean = false): string[] {
  if (isDerived) {
    const greenPalette = [
      "#10b981", "#059669", "#047857", "#065f46", "#064e3b",
      "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857"
    ];
    return greenPalette.slice(0, count);
  }

  const bluePalette = [
    "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a",
    "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"
  ];
  return bluePalette.slice(0, count);
}
