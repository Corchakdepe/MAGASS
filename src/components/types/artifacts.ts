/**
 * Raw result item from the API
 * Represents a graph, map, or matrix artifact
 */
export type RawResultItem = {
  id: string;
  name: string;
  kind: "graph" | "map" | "matrix";
  format: "csv" | "json" | "html" | "png";
  url: string;
  api_full_url?: string;
  created?: string;
  meta?: Record<string, any>;
};

/**
 * GraphItem is an alias for RawResultItem
 * Used specifically for graph artifacts
 */
export type GraphItem = RawResultItem;

/**
 * MapItem is an alias for RawResultItem
 * Used specifically for map artifacts
 */
export type MapItem = RawResultItem;
