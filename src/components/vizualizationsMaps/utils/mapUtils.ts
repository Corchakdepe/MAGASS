// src/components/visualizations/maps/utils/mapUtils.ts

import { MapKind, MapMetadata, MapContext } from "../types";
import { MATRICES } from "@/lib/analysis/constants";

/**
 * Extract instant number from map name
 * Example: "MapaCirculos_instante2928D60S0.28C1624.37707.html" -> 2928
 */
export const extractInstantFromName = (name: string): number => {
  const match = name.match(/instante(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Map backend map kinds to frontend map types
 */
export const getMapType = (kind: string, filename: string = ""): MapKind => {
  const typeMap: Record<string, MapKind> = {
    MapaCirculos: "circle",
    MapaDensidad: "density",
    MapaDesplazamientos: "displacement",
    MapaVoronoi: "voronoi",
    Voronoi: "voronoi",
    capacity: "capacity",
    density_video: "density_video",
  };

  if (typeMap[kind]) return typeMap[kind];

  // Derive from filename when kind is generic "map"
  if (filename.includes("MapaCirculos")) return "circle";
  if (filename.includes("MapaDensidad")) return "density";
  if (filename.includes("MapaDesplazamientos") || filename.includes("Desplazamientos"))
    return "displacement";
  if (filename.includes("Voronoi")) return "voronoi";
  if (filename.includes("Capacidades")) return "capacity";
  if (filename.includes("video")) return "density_video";

  return kind.toLowerCase() as MapKind;
};

/**
 * Get display name for map kind
 */
export const getMapKindDisplay = (kind: string): string => {
  const kindMap: Record<string, string> = {
    density: "Density Heatmap",
    voronoi: "Voronoi Diagram",
    circle: "Circle Map",
    displacement: "Displacement Map",
    capacity: "Capacity Map",
    density_video: "Density Video Animation",
  };

  return kindMap[kind] || kind.charAt(0).toUpperCase() + kind.slice(1);
};

/**
 * Format map name for display
 */
export const prettyMapName = (name: string): string => {
  if (!name) return "Unnamed Map";

  // Remove timestamp prefix if present (YYYYMMDD_HHMMSS_)
  const withoutTimestamp = name.replace(/^\d{8}_\d{6}_/, "");

  // Remove file extension
  const withoutExtension = withoutTimestamp.replace(/\.\w+$/, "");

  // Replace underscores with spaces
  const withSpaces = withoutExtension.replace(/_/g, " ");

  // Add spaces before capital letters
  return withSpaces.replace(/([A-Z])/g, " $1").trim();
};

/**
 * Get matrix label from ID using MATRICES constant
 */
export const getMatrixLabel = (matrixType: string | number | undefined): string => {
  if (!matrixType || matrixType === "Unknown") return "Unknown";

  const matrixId = typeof matrixType === 'string' ? parseInt(matrixType, 10) : matrixType;
  const matrix = MATRICES.find(m => m.id === matrixId);

  if (matrix) {
    return matrix.label;
  }

  return String(matrixType);
};

/**
 * Format stations for display
 */
export const formatStations = (stations: number[] | string | undefined): string => {
  if (!stations) return "Not specified";
  if (stations === "all") return "All stations";
  if (typeof stations === 'string') return stations;
  if (Array.isArray(stations)) {
    if (stations.length === 0) return "No stations";
    if (stations.length > 10) return `${stations.length} stations (${stations.slice(0, 5).join(", ")}...)`;
    return stations.join(", ");
  }
  return String(stations);
};

/**
 * Format instants for display
 */
export const formatInstants = (instant?: number, start?: number, end?: number): string => {
  if (start !== undefined && end !== undefined) {
    if (start === end) return `t = ${start}`;
    return `t = ${start} → ${end} (${end - start + 1} frames)`;
  }
  if (instant !== undefined) return `t = ${instant}`;
  return "Not specified";
};

/**
 * Build full URL for a map file
 */
export const buildMapUrl = (apiBase: string, runId: string, filename: string): string => {
  return `${apiBase}/results/file/${runId}/${filename}`;
};

/**
 * Build URL for companion JSON file
 */
export const buildMapJsonUrl = (apiBase: string, runId: string, mapUrl: string): string => {
  // Replace extension with .json
  const jsonFilename = mapUrl.replace(/\.(html|png|mp4)$/, '.json');
  return `${apiBase}/results/file/${runId}/${jsonFilename}`;
};