import type {MapKey} from "@/types/analysis";

export function buildMapArg(
  apiKey: MapKey,
  inst: Record<string, string>,
  st: Record<string, string>,
  labels: Record<string, boolean>,
  useFilter: boolean,
): string | null {
  if (apiKey === "mapa_desplazamientos") {
    const inst0 = (inst["mapa_desplazamientos_inst"] || "").trim();
    const dOri = (inst["mapa_desplazamientos_d_ori"] || "").trim();
    const dDst = (inst["mapa_desplazamientos_d_dst"] || "").trim();
    const mov = (inst["mapa_desplazamientos_mov"] || "").trim();
    const tipo = (inst["mapa_desplazamientos_tipo"] || "").trim();
    if (!inst0 || !dOri || !dDst || !mov || !tipo) return null;
    return `${inst0};${dOri};${dDst};${mov};${tipo}`;
  }

  const supportsStations =
    apiKey === "mapa_densidad" || apiKey === "mapa_circulo" || apiKey === "mapa_voronoi";

  const base = (inst[apiKey] || "").trim();
  if (!base) return null;

  let spec = base;

  if (supportsStations && !useFilter) {
    const stations = (st[apiKey] || "").trim();
    if (stations) spec += `+${stations}`;
  }

  if (apiKey === "mapa_circulo") {
    const labelsOn = labels[apiKey] ?? false;
    if (labelsOn) spec += "-L";
  }

  return spec;
}
