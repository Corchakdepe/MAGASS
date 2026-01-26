// types/core-data.ts
/**
 * Central data model for BikeSim application
 * This file contains all core types for simulation and analysis
 */

/**
 * Main context for a bike simulation run
 */
export interface BikeSimulationContext {
  // Identity and metadata
  meta: SimulationMeta;

  // Configuration used for this simulation
  config: SimulationConfig;

  // Infrastructure information
  infrastructure: InfrastructureData;

  // Simulation results
  results: SimulationResults;

  // Analysis artifacts (maps, graphs, filters)
  artifacts: AnalysisArtifacts;

  // UI state (persisted preferences)
  uiState?: UIState;
}

/**
 * Simulation metadata
 */
export interface SimulationMeta {
  runId: string;
  simName: string;
  created: string; // ISO date string
  lastModified: string; // ISO date string
  version?: string; // Version of simulator used
}

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  inputFolder: string;
  outputFolder: string;
  parameters: SimulationParameters;
  advanced?: AdvancedConfig;
}

/**
 * Core simulation parameters
 */
export interface SimulationParameters {
  delta: number; // Time interval in minutes
  stress: number; // Stress level (0-100)
  walkCost: number; // Walking cost (0-100)
  stressType: StressType;
  dias?: string; // Specific days to simulate
}

export type StressType = 0 | 1 | 2 | 3;

/**
 * Advanced configuration options
 */
export interface AdvancedConfig {
  deltaMode?: 'media' | 'acumulada';
  deltaValue?: number;
  customInputFolder?: string;
  customOutputFolder?: string;
}

/**
 * Infrastructure and station data
 */
export interface InfrastructureData {
  city: string;
  numBikes: number;
  numStations: number;
  stations?: StationInfo[];
}

/**
 * Individual station information
 */
export interface StationInfo {
  id: number;
  name?: string;
  lat: number;
  lon: number;
  capacity: number;
  address?: string;
}

/**
 * Simulation results container
 */
export interface SimulationResults {
  summary?: SimulationSummaryData;
  metrics?: PerformanceMetrics;
  rawData?: RawSimulationData;
}

/**
 * Summary statistics from simulation
 */
export interface SimulationSummaryData {
  deltaMinutes: number;
  stressPercentage: number;

  // Distance metrics
  realPickupKms: number;
  realDropoffKms: number;
  fictionalPickupKms: number;
  fictionalDropoffKms: number;

  // Resolution metrics
  resolvedRealPickups: number;
  resolvedRealDropoffs: number;
  unresolvedRealPickups: number;
  unresolvedRealDropoffs: number;

  resolvedFictionalPickups: number;
  resolvedFictionalDropoffs: number;
  unresolvedFictionalPickups: number;
  unresolvedFictionalDropoffs: number;
}

/**
 * Additional performance metrics
 */
export interface PerformanceMetrics {
  executionTimeSeconds?: number;
  averageOccupancy?: number;
  peakOccupancy?: number;
  stationUtilization?: Record<number, number>;
}

/**
 * Raw simulation data (if needed)
 */
export interface RawSimulationData {
  csvData?: string;
  [key: string]: any;
}

/**
 * Container for all analysis artifacts
 */
export interface AnalysisArtifacts {
  maps: Map<string, AnalysisArtifact>;
  graphs: Map<string, AnalysisArtifact>;
  filters: Map<string, AnalysisArtifact>;
  matrices?: Map<string, AnalysisArtifact>;
}

/**
 * Single analysis artifact (map, graph, or filter result)
 */
export interface AnalysisArtifact {
  id: string;
  name: string;
  displayName: string;
  kind: ArtifactKind;
  format: ArtifactFormat;
  url: string;
  apiUrl?: string;
  created: string;
  metadata: ArtifactMetadata;
  size?: number; // File size in bytes
  favorite?: boolean;
}

export type ArtifactKind = 'graph' | 'map' | 'filter' | 'matrix' | 'video';
export type ArtifactFormat = 'json' | 'html' | 'csv' | 'png' | 'mp4';

/**
 * Metadata for an artifact
 */
export interface ArtifactMetadata {
  // Graph-specific
  type?: 'bar' | 'line' | 'area' | 'scatter';
  xLabel?: string;
  yLabel?: string;
  title?: string;

  // Map-specific
  mapType?: 'density' | 'voronoi' | 'circle' | 'displacement';
  instantes?: string;

  // Common
  stations?: number[];
  matrices?: number[];
  parameters?: Record<string, any>;
  filter?: FilterConfiguration;

  // Custom metadata
  [key: string]: any;
}

/**
 * Filter configuration
 */
export interface FilterConfiguration {
  kind: FilterKind;
  operator: FilterOperator;
  value: string;
  dayPct?: string;
  days?: string;
  allowedFailDays?: string;
  stationsPct?: string;
  stationsList?: string;
}

export type FilterKind = 'EstValor' | 'EstValorDias' | 'Horas' | 'Porcentaje';
export type FilterOperator = '>=' | '<=' | '>' | '<';

/**
 * UI state for persistence
 */
export interface UIState {
  // Selected items
  selectedMapId?: string;
  selectedGraphId?: string;
  selectedFilterId?: string;

  // Favorites
  favoriteMapIds: Set<string>;
  favoriteGraphIds: Set<string>;

  // View preferences
  viewMode?: 'list' | 'grid';
  sidebarOpen?: boolean;

  // Search and filters
  searchText?: string;
  kindFilter?: string;
  formatFilter?: string;
  onlyFavorites?: boolean;
}

/**
 * Matrix information
 */
export interface MatrixInfo {
  id: number;
  label: string;
  description?: string;
  category?: 'occupation' | 'distance' | 'requests' | 'fictional';
}

/**
 * Analysis configuration for creating maps/graphs
 */
export interface AnalysisConfiguration {
  runId: string;
  inputFolder: string;
  outputFolder: string;
  seleccionAgregacion: string; // Matrix selection

  // Delta configuration
  deltaMedia?: number;
  deltaAcumulada?: number;

  // Filter configuration
  useFilterForMaps?: boolean;
  useFilterForGraphs?: boolean;
  filtro?: string;
  tipoFiltro?: FilterKind;

  // Map-specific
  mapConfigs?: MapConfiguration[];

  // Graph-specific
  graphConfigs?: GraphConfiguration[];
}

/**
 * Map creation configuration
 */
export interface MapConfiguration {
  type: 'mapa_densidad' | 'mapa_circulo' | 'mapa_voronoi' | 'mapa_desplazamientos';
  name?: string;
  instantes: string;
  stations?: string;
  labels?: boolean;

  // Displacement map specific
  deltaOrigen?: string;
  deltaDestino?: string;
  movimiento?: string;
  tipo?: string;
}

/**
 * Graph creation configuration
 */
export interface GraphConfiguration {
  type: 'graf_barras_est_med' | 'graf_barras_est_acum' | 'graf_linea_comp_est' | 'graf_barras_dia' | 'graf_linea_comp_mats';
  stations?: string;
  days?: string;
  mode?: 'M' | 'A';
  freq?: boolean;
  delta?: string;
}

/**
 * API response types
 */
export interface SimulationAPIResponse {
  success: boolean;
  data?: Partial<BikeSimulationContext>;
  error?: APIError;
}

export interface AnalysisAPIResponse {
  success: boolean;
  artifacts?: AnalysisArtifact[];
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

/**
 * List response for runs
 */
export interface RunsListResponse {
  simulations: RunListItem[];
  total: number;
}

export interface RunListItem {
  name: string;
  simfolder: string;
  created: string;
  file_count: number;
  cityname?: string;
  numberOfStations?: number;
  numberOfBikes?: number;
}

/**
 * Utility type for station selection
 */
export interface StationSelection {
  stations: number[];
  formatted: string;
  isEmpty: boolean;
}

/**
 * Type guards
 */
export function isValidStressType(value: any): value is StressType {
  return [0, 1, 2, 3].includes(value);
}

export function isValidArtifactKind(value: any): value is ArtifactKind {
  return ['graph', 'map', 'filter', 'matrix', 'video'].includes(value);
}

export function isValidFilterKind(value: any): value is FilterKind {
  return ['EstValor', 'EstValorDias', 'Horas', 'Porcentaje'].includes(value);
}

/**
 * Helper functions for working with contexts
 */
export const ContextHelpers = {
  /**
   * Create an empty context
   */
  createEmpty(): BikeSimulationContext {
    return {
      meta: {
        runId: '',
        simName: '',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      config: {
        inputFolder: '',
        outputFolder: '',
        parameters: {
          delta: 15,
          stress: 0,
          walkCost: 100,
          stressType: 0,
        },
      },
      infrastructure: {
        city: '',
        numBikes: 0,
        numStations: 0,
      },
      results: {},
      artifacts: {
        maps: new Map(),
        graphs: new Map(),
        filters: new Map(),
      },
      uiState: {
        favoriteMapIds: new Set(),
        favoriteGraphIds: new Set(),
      },
    };
  },

  /**
   * Merge partial context updates
   */
  merge(
    base: BikeSimulationContext,
    updates: Partial<BikeSimulationContext>
  ): {
    artifacts: {
      filters: Map<string, AnalysisArtifact>;
      graphs: Map<string, AnalysisArtifact>;
      maps: Map<string, AnalysisArtifact>;
      matrices?: Map<string, AnalysisArtifact> | undefined
    };
    config: {
      advanced?: AdvancedConfig | undefined;
      inputFolder: string;
      outputFolder: string;
      parameters: SimulationParameters
    };
    infrastructure: { city: string; numBikes: number; numStations: number; stations?: StationInfo[] | undefined };
    meta: { created: string; lastModified: string; runId: string; simName: string; version?: string | undefined };
    results: {
      metrics?: PerformanceMetrics | undefined;
      rawData?: RawSimulationData | undefined;
      summary?: SimulationSummaryData | undefined
    };
    uiState: {
      favoriteGraphIds?: Set<string> | undefined;
      favoriteMapIds?: Set<string> | undefined;
      formatFilter?: string | undefined;
      kindFilter?: string | undefined;
      onlyFavorites?: false | true | undefined;
      searchText?: string | undefined;
      selectedFilterId?: string | undefined;
      selectedGraphId?: string | undefined;
      selectedMapId?: string | undefined;
      sidebarOpen?: false | true | undefined;
      viewMode?: "list" | "grid" | undefined
    }
  } {
    return {
      ...base,
      ...updates,
      meta: { ...base.meta, ...updates.meta, lastModified: new Date().toISOString() },
      config: { ...base.config, ...updates.config },
      infrastructure: { ...base.infrastructure, ...updates.infrastructure },
      results: { ...base.results, ...updates.results },
      artifacts: { ...base.artifacts, ...updates.artifacts },
      uiState: { ...base.uiState, ...updates.uiState },
    };
  },

  /**
   * Add artifact to context
   */
  addArtifact(
    context: BikeSimulationContext,
    artifact: AnalysisArtifact
  ): BikeSimulationContext {
    const updated = { ...context };

    switch (artifact.kind) {
      case 'map':
        updated.artifacts.maps.set(artifact.id, artifact);
        break;
      case 'graph':
        updated.artifacts.graphs.set(artifact.id, artifact);
        break;
      case 'filter':
        updated.artifacts.filters.set(artifact.id, artifact);
        break;
      case 'matrix':
        if (!updated.artifacts.matrices) {
          updated.artifacts.matrices = new Map();
        }
        updated.artifacts.matrices.set(artifact.id, artifact);
        break;
    }

    updated.meta.lastModified = new Date().toISOString();
    return updated;
  },

  /**
   * Get all artifacts as array
   */
  getAllArtifacts(context: BikeSimulationContext): AnalysisArtifact[] {
    return [
      ...Array.from(context.artifacts.maps.values()),
      ...Array.from(context.artifacts.graphs.values()),
      ...Array.from(context.artifacts.filters.values()),
      ...(context.artifacts.matrices ? Array.from(context.artifacts.matrices.values()) : []),
    ];
  },

  /**
   * Serialize context to JSON (converting Maps and Sets)
   */
  toJSON(context: BikeSimulationContext): any {
    return {
      ...context,
      artifacts: {
        maps: Array.from(context.artifacts.maps.entries()),
        graphs: Array.from(context.artifacts.graphs.entries()),
        filters: Array.from(context.artifacts.filters.entries()),
        matrices: context.artifacts.matrices
          ? Array.from(context.artifacts.matrices.entries())
          : [],
      },
      uiState: context.uiState
        ? {
            ...context.uiState,
            favoriteMapIds: Array.from(context.uiState.favoriteMapIds),
            favoriteGraphIds: Array.from(context.uiState.favoriteGraphIds),
          }
        : undefined,
    };
  },

  /**
   * Deserialize context from JSON
   */
  fromJSON(json: any): BikeSimulationContext {
    return {
      ...json,
      artifacts: {
        maps: new Map(json.artifacts.maps || []),
        graphs: new Map(json.artifacts.graphs || []),
        filters: new Map(json.artifacts.filters || []),
        matrices: json.artifacts.matrices ? new Map(json.artifacts.matrices) : undefined,
      },
      uiState: json.uiState
        ? {
            ...json.uiState,
            favoriteMapIds: new Set(json.uiState.favoriteMapIds || []),
            favoriteGraphIds: new Set(json.uiState.favoriteGraphIds || []),
          }
        : undefined,
    };
  },
};