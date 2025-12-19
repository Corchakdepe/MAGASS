// types/simulation.ts

/**
 * Represents a single simulation entry from simulations_history.json
 */
export interface SimulationHistoryItem {
  simname: string;
  simfolder: string;
  cityname: string;
  numberOfStations: number;
  numberOfBikes: number;
  simdata: Record<string, unknown>;
  simdataId: string;
}

/**
 * Root structure of simulations_history.json
 */
export interface SimulationsHistory {
  simulations: SimulationHistoryItem[];
}

/**
 * Legacy data structure for initial load data
 * @deprecated Use SimulationHistoryItem instead sigue aqui para preubas!!!!!!!
 */
export interface loadData {
  numBikes: number;
  numStations: number;
  city: string;
}

export interface SimulationSummaryData {
  deltaMinutes: number;
  stressPercentage: number;
  realPickupKms: number;
  realDropoffKms: number;
  fictionalPickupKms: number;
  fictionalDropoffKms: number;
  resolvedRealPickups: number;
  resolvedRealDropoffs: number;
  unresolvedRealPickups: number;
  unresolvedRealDropoffs: number;
  resolvedFictionalPickups: number;
  resolvedFictionalDropoffs: number;
  unresolvedFictionalPickups: number;
  unresolvedFictionalDropoffs: number;
}

export interface SimulationResumeData {
  deltaMinutes: number;
  stressPercentage: number;
}

export interface SimulationData {
  folder: string;
  created?: string;
  fileCount?: number;
  simulationSummary?: SimulationSummaryData;
  chartData: any[];
  mapUrl: string;
  heatmapUrl: string;
  csvData: string;
  simName: string;
}


