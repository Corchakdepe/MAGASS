import type { MapKey } from "@/types/analysis";

function normalizeSemicolonNumberList(value: unknown): string {
  return String(value ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .join(";");
}

function normalizeInteger(value: unknown): string {
  const s = String(value ?? "").trim();
  return /^-?\d+$/.test(s) ? s : "";
}

export function buildMapArg(
  apiKey: MapKey,
  inst: Record<string, string> = {},
  st: Record<string, string> = {},
  labels: Record<string, boolean> = {},
  useFilter: boolean = false
): string | null {
  if (apiKey === "mapa_desplazamientos") {
    const inst0 = normalizeInteger(inst["mapa_desplazamientos_inst"]);
    const dOri = normalizeInteger(inst["mapa_desplazamientos_d_ori"]);
    const dDst = normalizeInteger(inst["mapa_desplazamientos_d_dst"]);
    const mov = normalizeInteger(inst["mapa_desplazamientos_mov"]);
    const tipo = normalizeInteger(inst["mapa_desplazamientos_tipo"]);

    if (!inst0 || !dOri || !dDst || !mov || !tipo) return null;
    return `${inst0};${dOri};${dDst};${mov};${tipo}`;
  }

  const base = normalizeSemicolonNumberList(inst[apiKey]);
  if (!base) return null;

  if (apiKey === "mapa_voronoi") {
    return base;
  }

  let spec = base;

  const supportsStations =
    apiKey === "mapa_densidad" || apiKey === "mapa_circulo";

  if (supportsStations && !useFilter) {
    const stations = normalizeSemicolonNumberList(st[apiKey]);
    if (stations) {
      spec += `+${stations}`;
    }
  }

  if (apiKey === "mapa_circulo" && (labels[apiKey] ?? false)) {
    spec += "-L";
  }

  return spec;
}
