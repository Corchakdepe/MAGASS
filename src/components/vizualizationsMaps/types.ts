// src/components/visualizations/maps/types.ts

// src/components/visualizations/maps/types.ts

import { ReactNode } from "react";

// Main map metadata interface (matches backend)
export interface MapMetadata {
  id: string;
  kind: string; // "density", "voronoi", "circle", "displacement", "capacity"
  format: string; // "html", "png", "json"
  name: string;
  url?: string;
  api_full_url?: string;
  file_path?: string;
  instant?: number;
  stations?: number[];
  error?: string;
  created?: string;
  context?: MapContext;
}

// Context from JSON metadata file
export interface MapContext {
  map_name?: string;
  matrix_type?: string | number;
  delta_media?: number;
  generated_at?: string;
  map_kind?: string;
  status?: "success" | "error" | "warning";
  instant?: number;
  start_instant?: number;
  end_instant?: number;
  stations?: number[] | "all";
  stations_count?: number;
  show_labels?: boolean;
  total_frames?: number;
  data_summary?: DataSummary;
  files?: GeneratedFiles;
  error?: string;
  [key: string]: any;
}

export interface DataSummary {
  min_value?: number;
  max_value?: number;
  mean_value?: number;
  [key: string]: any;
}

export interface GeneratedFiles {
  html?: string;
  json?: string;
  csv?: string;
  [key: string]: string | undefined;
}

// Raw result from API
export interface RawResultItem {
  id: string | number;
  name?: string;
  kind?: string;
  format?: string;
  url?: string;
  api_full_url?: string;
  created?: string;
}

// Persisted state for map viewer
export interface PersistedState {
  selectedMapId?: string;
  favoritesIds: string[];
  historyOpen: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;
  formatFilter: string;
}

// Station pick event
export interface StationPickEvent {
  mapName: string;
  station: number;
  data: any;
}

// Component props
export interface VisualizationMapsProps {
  runId: string;
  apiBase: string;
  maps?: RawResultItem[];
  onStationPick?: (event: StationPickEvent) => void;
}

// Map message for iframe communication
export interface MapMessage {
  type: string;
  command?: string;
  mapName?: string;
  station?: number;
  data?: any;
}

// Map configuration component props
export interface MapConfigurationProps {
  map: MapMetadata;
  mapJson?: MapContext | null;
  className?: string;
}

// Utility function types
export type MapKind = "density" | "voronoi" | "circle" | "displacement" | "capacity" | "density_video";
export type MapFormat = "html" | "png" | "json" | "mp4";

export interface RawResultItem {
  id: string | number;
  name?: string;
  kind?: string;
  format?: string;
  url?: string;
  api_full_url?: string;
  created?: string;
}

export interface PersistedState {
  selectedMapId?: string;
  favoritesIds: string[];
  historyOpen: boolean;
  searchText: string;
  onlyFavorites: boolean;
  kindFilter: string;
  formatFilter: string;
}

export interface StationPickEvent {
  mapName: string;
  station: number;
  data: any;
}

export interface VisualizationMapsProps {
  runId: string;
  apiBase: string;
  maps?: RawResultItem[];
  onStationPick?: (event: StationPickEvent) => void;
}

export interface MapMessage {
  type: string;
  command?: string;
  mapName?: string;
  station?: number;
  data?: any;
}
