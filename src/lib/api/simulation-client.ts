// lib/api/simulation-client.ts
import type {
  BikeSimulationContext,
  SimulationParameters,
  AnalysisConfiguration,
  AnalysisArtifact,
  RunsListResponse,
  SimulationAPIResponse,
  AnalysisAPIResponse,
  SimulationSummaryData,
} from '@/types/core-data';
import { ContextHelpers } from '@/types/core-data';

/**
 * Custom error class for simulation API errors
 */
export class SimulationAPIError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'SimulationAPIError';
  }
}

/**
 * API Client for interacting with the Python backend
 */
export class SimulationAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        throw new SimulationAPIError(
          errorData.detail || errorData.message || `HTTP ${response.status}`,
          errorData.code || `HTTP_${response.status}`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SimulationAPIError) {
        throw error;
      }

      throw new SimulationAPIError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Execute a simulation
   */
  async runSimulation(
    params: SimulationParameters,
    folders?: { input?: string; output?: string; simName?: string }
  ): Promise<BikeSimulationContext> {
    const payload = {
      ruta_entrada: folders?.input || './Datos/Marzo_Reales',
      ruta_salida: folders?.output || null,
      stress_type: params.stressType,
      stress: params.stress / 100,
      walk_cost: params.walkCost / 100,
      delta: params.delta,
      dias: params.dias || null,
      simname: folders?.simName || null,
    };

    const response = await this.fetch<any>('/exe/simular-json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return this.parseSimulationResponse(response, params);
  }

  /**
   * Run analysis (maps, graphs, filters)
   */
  async runAnalysis(config: AnalysisConfiguration): Promise<AnalysisAPIResponse> {
    const payload = this.formatAnalysisRequest(config);

    const response = await this.fetch<any>('/exe/analizar-json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      artifacts: this.parseAnalysisResponse(response),
    };
  }

  /**
   * List all simulation runs
   */
  async listRuns(): Promise<RunsListResponse> {
    const response = await this.fetch<RunsListResponse>('/list-simulations', {
      cache: 'no-store' as any,
    });

    return response;
  }

  /**
   * Get specific simulation run data
   */
  async getRun(runId: string): Promise<BikeSimulationContext> {
    // Fetch simulation summary
    const summary = await this.getSimulationSummary(runId);

    // Fetch initial data (infrastructure info)
    const initialData = await this.getInitialData(runId);

    // Fetch available artifacts
    const artifacts = await this.getArtifacts(runId);

    // Construct context
    const context: BikeSimulationContext = {
      meta: {
        runId,
        simName: initialData.simname || runId,
        created: '', // Would come from list
        lastModified: new Date().toISOString(),
      },
      config: {
        inputFolder: `./results/${runId}`,
        outputFolder: `./results/${runId}`,
        parameters: {
          delta: summary.deltaMinutes || 15,
          stress: summary.stressPercentage || 0,
          walkCost: 100,
          stressType: 0,
        },
      },
      infrastructure: {
        city: initialData.city,
        numBikes: initialData.numBikes,
        numStations: initialData.numStations,
      },
      results: {
        summary,
      },
      artifacts: {
        maps: new Map(artifacts.maps.map(a => [a.id, a])),
        graphs: new Map(artifacts.graphs.map(a => [a.id, a])),
        filters: new Map(artifacts.filters.map(a => [a.id, a])),
      },
    };

    return context;
  }

  /**
   * Get simulation summary
   */
  async getSimulationSummary(runId?: string): Promise<SimulationSummaryData> {
    const endpoint = runId
      ? `/simulation-summary?folder=${encodeURIComponent(runId)}`
      : '/simulation-summary';

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        cache: 'no-store' as any,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      return this.parseSummaryData(text);
    } catch (error) {
      // Return empty summary if failed
      return this.getEmptySummary();
    }
  }

  /**
   * Get initial/infrastructure data
   */
  async getInitialData(runId: string): Promise<any> {
    try {
      const response = await this.fetch<any>(
        `/dashboard/initial-data?run=${encodeURIComponent(runId)}`,
        { cache: 'no-store' as any }
      );
      return response;
    } catch {
      return {
        city: 'Unknown',
        numBikes: 0,
        numStations: 0,
        simname: runId,
      };
    }
  }

  /**
   * Get artifacts for a run
   */
  async getArtifacts(runId: string): Promise<{
    maps: AnalysisArtifact[];
    graphs: AnalysisArtifact[];
    filters: AnalysisArtifact[];
  }> {
    const [mapsRes, graphsRes, filtersRes] = await Promise.allSettled([
      this.fetch<{ items: any[] }>(
        `/results/list?run=${encodeURIComponent(runId)}&kind=map`,
        { cache: 'no-store' as any }
      ),
      this.fetch<{ items: any[] }>(
        `/results/list?run=${encodeURIComponent(runId)}&kind=graph`,
        { cache: 'no-store' as any }
      ),
      this.fetch<{ items: any[] }>(
        `/results/list?run=${encodeURIComponent(runId)}&kind=filter`,
        { cache: 'no-store' as any }
      ),
    ]);

    const maps = mapsRes.status === 'fulfilled'
      ? mapsRes.value.items.map(this.parseArtifact)
      : [];
    const graphs = graphsRes.status === 'fulfilled'
      ? graphsRes.value.items.map(this.parseArtifact)
      : [];
    const filters = filtersRes.status === 'fulfilled'
      ? filtersRes.value.items.map(this.parseArtifact)
      : [];

    return { maps, graphs, filters };
  }

  /**
   * Delete a simulation run
   */
  async deleteRun(runId: string): Promise<void> {
    await this.fetch(`/simulations/${encodeURIComponent(runId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Parse simulation response from backend
   */
  private parseSimulationResponse(
    data: any,
    params: SimulationParameters
  ): BikeSimulationContext {
    const runId = data.folder || data.simfolder || '';
    const summary = data.simulationSummary
      ? (typeof data.simulationSummary === 'string'
          ? this.parseSummaryData(data.simulationSummary)
          : data.simulationSummary)
      : this.getEmptySummary();

    return {
      meta: {
        runId,
        simName: data.simName || runId,
        created: data.created || new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      config: {
        inputFolder: data.inputFolder || '',
        outputFolder: data.outputFolder || runId,
        parameters: params,
      },
      infrastructure: {
        city: data.city || '',
        numBikes: data.numBikes || 0,
        numStations: data.numStations || 0,
      },
      results: {
        summary,
      },
      artifacts: {
        maps: new Map(),
        graphs: new Map(),
        filters: new Map(),
      },
    };
  }

  /**
   * Parse summary data string
   */
  private parseSummaryData(dataString: string): SimulationSummaryData {
    const cleaned = dataString.trim().replace(/^"|"$/g, '');
    const values = cleaned.split(',').map((v) => Number(v.trim()) || 0);

    return {
      deltaMinutes: values[0] || 0,
      stressPercentage: values[1] || 0,
      realPickupKms: values[2] || 0,
      realDropoffKms: values[3] || 0,
      fictionalPickupKms: values[4] || 0,
      fictionalDropoffKms: values[5] || 0,
      resolvedRealPickups: values[6] || 0,
      resolvedRealDropoffs: values[7] || 0,
      unresolvedRealPickups: values[8] || 0,
      unresolvedRealDropoffs: values[9] || 0,
      resolvedFictionalPickups: values[10] || 0,
      resolvedFictionalDropoffs: values[11] || 0,
      unresolvedFictionalPickups: values[12] || 0,
      unresolvedFictionalDropoffs: values[13] || 0,
    };
  }

  /**
   * Get empty summary
   */
  private getEmptySummary(): SimulationSummaryData {
    return {
      deltaMinutes: 0,
      stressPercentage: 0,
      realPickupKms: 0,
      realDropoffKms: 0,
      fictionalPickupKms: 0,
      fictionalDropoffKms: 0,
      resolvedRealPickups: 0,
      resolvedRealDropoffs: 0,
      unresolvedRealPickups: 0,
      unresolvedRealDropoffs: 0,
      resolvedFictionalPickups: 0,
      resolvedFictionalDropoffs: 0,
      unresolvedFictionalPickups: 0,
      unresolvedFictionalDropoffs: 0,
    };
  }

  /**
   * Format analysis request for backend
   */
  private formatAnalysisRequest(config: AnalysisConfiguration): any {
    const payload: any = {
      input_folder: config.inputFolder,
      output_folder: config.outputFolder,
      seleccion_agregacion: config.seleccionAgregacion,
      delta_media: config.deltaMedia,
      delta_acumulada: config.deltaAcumulada,
      filtro: config.filtro,
      tipo_filtro: config.tipoFiltro,
      use_filter_for_maps: config.useFilterForMaps,
      use_filter_for_graphs: config.useFilterForGraphs,
    };

    // Add map configurations
    if (config.mapConfigs) {
      for (const mapConfig of config.mapConfigs) {
        payload[mapConfig.type] = this.formatMapConfig(mapConfig);
      }
    }

    // Add graph configurations
    if (config.graphConfigs) {
      for (const graphConfig of config.graphConfigs) {
        payload[graphConfig.type] = this.formatGraphConfig(graphConfig);
      }
    }

    return payload;
  }

  /**
   * Format map configuration
   */
  private formatMapConfig(config: any): string {
    if (config.type === 'mapa_desplazamientos') {
      return `${config.instantes};${config.deltaOrigen};${config.deltaDestino};${config.movimiento};${config.tipo}`;
    }

    let spec = config.instantes;
    if (config.stations) {
      spec += `+${config.stations}`;
    }
    if (config.labels) {
      spec += '-L';
    }
    return spec;
  }

  /**
   * Format graph configuration
   */
  private formatGraphConfig(config: any): string | any[] {
    if (config.type === 'graf_linea_comp_est' && config.stations) {
      const stationIds = config.stations.split(';').map(Number);
      return stationIds.map(id => ({ station_id: id, days: config.days || 'all' }));
    }

    return `${config.stations || ''}-${config.days || 'all'}`;
  }

  /**
   * Parse analysis response
   */
  private parseAnalysisResponse(data: any): AnalysisArtifact[] {
    // Backend might return different structures
    // Adapt as needed based on actual API response
    return [];
  }

  /**
   * Parse artifact from API response
   */
  private parseArtifact = (item: any): AnalysisArtifact => {
    return {
      id: item.id || item.name,
      name: item.name,
      displayName: this.prettyName(item.name),
      kind: item.kind,
      format: item.format,
      url: item.url,
      apiUrl: item.api_full_url,
      created: item.created || '',
      metadata: item.meta || {},
      size: item.size,
    };
  };

  /**
   * Create pretty display name from filename
   */
  private prettyName(raw: string): string {
    let s = raw.replace(/\.[^/.]+$/, ''); // Remove extension
    s = s.replace(/^\d{8}_\d{6}_/, ''); // Remove timestamp prefix
    s = s.replace(/_/g, ' '); // Replace underscores
    return s.trim();
  }
}

/**
 * Singleton instance
 */
export const simulationAPI = new SimulationAPIClient(
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
);

/**
 * Export types
 */
export type { SimulationAPIError };