export function parseStationsLoose(input: string): number[] {
  return Array.from(
    new Set(
      (input ?? "")
        .trim()
        .split(/[^0-9]+/g)
        .filter(Boolean)
        .map(Number)
    )
  ).filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0);
}

export function formatStationsCanonical(nums: number[]): string {
  return nums.join(";");
}
