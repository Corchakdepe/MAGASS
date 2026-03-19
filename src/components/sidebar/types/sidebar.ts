// types/sidebar.ts

// Simulation parameters from simdata
import {SimulationData} from "@/types/simulation";

export interface SimulationParameters {
  stress_type: number;
  stress: number;
  walk_cost: number;
  delta: number;
  dias: number[];
}


// History item from the API
export interface HistoryItem {
  simfolder: string;
  simname?: string;
  name?: string;
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
   simdata?: SimulationParameters;
  path?: string;
  created?: string;
  file_count?: number;
}

// Props for SidebarRunHistory component
export interface SidebarRunHistoryProps {
  onSimulationComplete?: (data: SimulationData) => void;
  currentRunId?: string;
  onRunIdChange?: (runId: string) => void;
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

// Extend SimulationData to include parameters
declare module '@/types/simulation' {
  interface SimulationData {
    parameters?: SimulationParameters | null;
  }
}