// src/components/visualizations/maps/utils/formatters.ts

export function prettyMapName(raw: string): string {
  let s = raw.replace(/(\d{8}_\d{6}_)/g, "");
  s = s.replace(/_/g, " ");
  return s.trim();
}

export function lsKey(runId: string): string {
  return `viz-maps-${runId}`;
}
