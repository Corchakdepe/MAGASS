// types/sidebar.ts

// Simulation item from history
import {SimulationParameters} from "@/types/core-data";

export interface SimulationHistoryItem {
  simfolder: string;
  simname?: string;
  name?: string; // Alias for simname
  simdataId?: string;
  cityname?: string;
  numberOfStations?: number;
  numberOfBikes?: number;
  total_capacity?: number;
  avg_capacity?: number;
  min_capacity?: number;
  max_capacity?: number;
  coordinates?: {
    avg_lat: number;
    avg_lon: number;
  };
  simdata?: SimulationParameters; // ← Aquí están los parámetros
  path?: string;
  created?: string;
}

// Props for SidebarRunHistory component
export interface SidebarRunHistoryProps {
  onSimulationComplete?: (runId: string) => void;
  currentRunId?: string;
  onRunIdChange?: (runId: string) => void;
}

export interface UseSimulationParametersReturn {
  parameters: SimulationParameters | null;
  loading: boolean;
  error: string | null;
  selectedSimulation: SimulationHistoryItem | null;
  fetchParameters: (simfolder: string) => Promise<void>;
  reset: () => void;
}

// Delete simulation state
export interface DeleteState {
  id: string | null;
  isDeleting: boolean;
  showConfirm: string | null;
}

// Return type for useSimulationDelete hook
export interface UseSimulationDeleteReturn {
  deleteState: DeleteState;
  handleDeleteClick: (simfolder: string, e: React.MouseEvent) => void;
  handleConfirmDelete: (simfolder: string) => Promise<void>;
  handleCancelDelete: () => void;
  setDeletingId: (id: string | null) => void;
  setShowDeleteConfirm: (id: string | null) => void;
}

// Return type for useSidebarHistory hook
export interface UseSidebarHistoryReturn {
  history: SimulationHistoryItem[];
  loadingHistory: boolean;
  loadHistory: () => Promise<void>;
  handleSelectRun: (item: SimulationHistoryItem) => void;
}