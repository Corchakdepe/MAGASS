export function parseDeltaFromRunId(runId?: string): number | null {
  if (!runId) return null;
  const m =
    runId.match(/(?:^|[_-])D(\d+)(?:$|[_-])/i) ?? runId.match(/D(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseInstantesLoose(input: string): number[] {
  const tokens = input
    .trim()
    .split(/[^0-9]+/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const nums = tokens
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0);

  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export function formatInstantesCanonical(nums: number[]): string {
  return nums.join(";");
}

export function parseStationsSimple(input: string): number[] {
  return Array.from(
    new Set(
      (input ?? "")
        .trim()
        .split(/[^0-9]+/g)
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0),
    ),
  ).sort((a, b) => a - b);
}

export function formatStationsCanonical(nums: number[]) {
  return nums.join(";");
}