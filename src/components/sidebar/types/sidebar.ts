import type {SimulationData} from "@/types/simulation";

export type SidebarNavigationProps = {
  simulationName?: string | null;
  currentFolder?: string | null;
};

export type SidebarRunHistoryProps = {
  onSimulationComplete?: (data: SimulationData) => void;
  currentRunId?: string | null;
  onRunIdChange?: (runId: string) => void;
};

export type SimulationPanelProps = {
  onSimulationComplete: (data: SimulationData) => void;
};

export type MapsAnalysisPanelProps = {
  onSimulationComplete: (data: SimulationData) => void;
  runId?: string;
  externalStationsMaps?: Record<string, string>;
  onClearExternalStationsMaps?: () => void;
};

export type GraphsAnalysisPanelProps = {
  onSimulationComplete: (data: SimulationData) => void;
  runId?: string;
};

export type HistoryItem = {
  name: string;
  simfolder: string;
  created: string;
  file_count: number;
  cityname?: string | null;
  numberOfStations?: number | null;
  numberOfBikes?: number | null;
};

export type SimulationSummary = {
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
};
