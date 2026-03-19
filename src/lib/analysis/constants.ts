import type { MapKey } from "@/types/analysis";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export const MATRICES = [
  { label: "Matriz externa", id: -1 },
  { label: "Ocupación", id: 0 },
  { label: "Ocupación relativa", id: 1 },
  { label: "Peticiones resueltas dejar", id: 5 },
  { label: "Peticiones no resueltas coger", id: 6 },
  { label: "Peticiones no resueltas dejar", id: 7 },
  { label: "Km ficticios dejar", id: 9 },
  { label: "Ficticias resueltas coger", id: 10 },
  { label: "Ficticias resueltas dejar", id: 11 },
  { label: "Ficticias no resueltas coger", id: 12 },
] as const;

export const MAPAS: { label: string; arg: MapKey }[] = [
  { label: "Mapa Densidad", arg: "mapa_densidad" },
  { label: "Mapa Voronoi", arg: "mapa_voronoi" },
  { label: "Mapa Círculo", arg: "mapa_circulo" },
  { label: "Mapa Desplazamientos", arg: "mapa_desplazamientos" },
];

export const MAP_KEY_SET = new Set<MapKey>([
  "mapa_densidad",
  "mapa_voronoi",
  "mapa_circulo",
  "mapa_desplazamientos",
]);
